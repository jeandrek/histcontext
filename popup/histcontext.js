function makeLink(url) {
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.innerText = url;
    return anchor;
}

function backToResults() {
    document.querySelector('#searchview').style.display = '';
    document.querySelector('#contextview').style.display = 'none';
}

function viewContext(visit) {
    function allVisitsInTimeframe(items, startTime, endTime, i, arr, cb) {
	if (i == items.length) {
	    cb(arr);
	} else {
	    browser.history.getVisits({url: items[i].url}).then(visits => {
		arr.push([
		    items[i],
		    visits.filter(visit =>
			(startTime <= visit.visitTime
			 && visit.visitTime <= endTime))
		]);
		allVisitsInTimeframe(items, startTime, endTime, i + 1, arr, cb);
	    });
	}
    }

    document.querySelector('#searchview').style.display = 'none';
    document.querySelector('#contextview').style.display = '';
    document.querySelector('#context > tbody').remove();
    var contextTbody = document.createElement('tbody');
    var startTime = visit.visitTime - 4*60*60*1000;
    var endTime = visit.visitTime + 4*60*60*1000;
    browser.history.search({
	text: '',
	startTime, endTime,
	maxResults: 10000
    }).then(items => {
	allVisitsInTimeframe(items, startTime, endTime, 0, [], results => {
	    var start = 0;
	    var end = results.length - 1;
	    var middle = results.findIndex(
		//contextVisit => contextVisit.visitId == visit.visitId
		x => x[0].id == visit.id
	    );

	    if (results.length > 31) {
		start = Math.max(0, middle - 15);
		end = Math.min(results.length - 1, middle + 15);
	    }
	    console.log(start + ' ' + end + ' ' + results.length);

	    for (var i = start; i <= end; i++) {
		var item = results[i][0];
		var visits = results[i][1];
		for (var contextVisit of visits) {
		    var row = document.querySelector('#contextrow').content.cloneNode(true);
		    var cells = row.querySelectorAll('td');
		    cells[0].innerText = item.title;
		    cells[1].appendChild(makeLink(item.url));
		    cells[2].innerText = new Date(item.lastVisitTime).toLocaleString();
		    if (i == middle) {
			row.children[0].style.fontWeight = 'bold';
		    }
		    contextTbody.appendChild(row);
		}
	    }
	});

	// var start = 0;
	// var end = items.length - 1;
	// var middle = items.findIndex(item => item.id == visit.id);

	// if (items.length > 31) {
	//     start = Math.max(0, middle - 15);
	//     end = Math.min(items.length - 1, middle + 15);
	// }

	// console.log(start + ' ' + end + ' ' + items.length);
	// for (var i = start; i <= end; i++) {
	//     var item = items[i];
	//     var row = document.querySelector('#contextrow').content.cloneNode(true);
	//     var cells = row.querySelectorAll('td');
	//     cells[0].innerText = item.title;
	//     cells[1].appendChild(makeLink(item.url));
	//     cells[2].innerText = new Date(item.lastVisitTime).toLocaleString();
	//     if (i == middle) {
	// 	row.children[0].style.fontWeight = 'bold';
	//     }
	//     contextTbody.appendChild(row);
	// }
    });
    document.querySelector('#context').appendChild(contextTbody);
}

function makeVisitRow(visit) {
    var row = document.querySelector('#visitrow').content.cloneNode(true);
    var cells = row.querySelectorAll('td');
    cells[1].innerText = new Date(visit.visitTime).toLocaleString();
    row.children[0].addEventListener('click', () => {
	viewContext(visit);
    });
    return row;
}

function addResultRow(tbody, item) {
    var row = document.querySelector('#resultrow').content.cloneNode(true);
    var tr = row.children[0];
    var cells = row.querySelectorAll('td');
    var expanded = false;
    var visitRows = null;

    tr.addEventListener('click', () => {
	if (!expanded) {
	    tr.className = 'selected';
	    cells[0].innerHTML = '&blacktriangledown;';
	    expanded = true;
	    visitRows = [];
	    var nextRow = tr.nextSibling;
	    browser.history.getVisits({url: item.url}).then(visits => {
		for (var visit of visits) {
		    visitRow = makeVisitRow(visit);
		    visitRows.push(visitRow.children[0]);
		    tbody.insertBefore(visitRow, nextRow);
		}
	    });
	} else {
	    tr.className = '';
	    cells[0].innerHTML = '&blacktriangleright;';
	    expanded = false;
	    for (var visitRow of visitRows) {
		tbody.removeChild(visitRow);
	    }
	}
    });
    cells[1].innerText = item.title;
    cells[2].appendChild(makeLink(item.url));
    cells[3].innerText = new Date(item.lastVisitTime).toLocaleString();
    tbody.appendChild(row);
}

function search() {
    var text = document.querySelector('#search').value;
    document.querySelector('#results > tbody').remove();
    var resultsTbody = document.createElement('tbody');
    browser.history.search({
	text: text,
	startTime: 0
    }).then(items => {
	for (var item of items) {
	    addResultRow(resultsTbody, item);
	}
    });
    document.querySelector('#results').appendChild(resultsTbody);
}

document.querySelector('#search').addEventListener('input', search);
document.querySelector('#backbutton').addEventListener('click', backToResults);
