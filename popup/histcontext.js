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

function addContextRow(tbody, title, url, timeString, bold) {
    var row = document.querySelector('#contextrow').content.cloneNode(true);
    var cells = row.querySelectorAll('td');
    cells[0].innerText = title;
    cells[1].appendChild(makeLink(url));
    cells[2].innerText = timeString;
    if (bold) {
	row.children[0].style.fontWeight = 'bold';
    }
    tbody.appendChild(row);
}

function viewContext(visit) {
    function allVisitsInTimeframe(items, startTime, endTime, exclude,
				  i, arr, cb) {
	// assuming all history items in timeframe have a visit in timeframe
	if (i == items.length) {
	    arr.sort((a, b) => b[1].visitTime - a[1].visitTime);
	    cb(arr);
	} else {
	    browser.history.getVisits({url: items[i].url}).then(visits => {
		arr = arr.concat(visits.filter(visit =>
		    (startTime <= visit.visitTime
		     && visit.visitTime <= endTime
		     && !exclude(visit))).map(visit => [items[i], visit]));
		allVisitsInTimeframe(items, startTime, endTime, exclude,
				     i + 1, arr, cb);
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
	/* At present: shows all visits for 31 history items
	 * (rather than n visits) */
	var start = 0;
	var end = items.length - 1;
	var middle = items.findIndex(
	    //contextVisit => contextVisit.visitId == visit.visitId
	    item => item.id == visit.id
	);
	if (items.length > 31) {
	    start = Math.max(0, middle - 15);
	    end = Math.min(items.length - 1, middle + 15);
	}
	allVisitsInTimeframe(items.slice(start, end+1), startTime, endTime,
			     //visit => visit.transition == 'reload',
			     visit => false,
			     0, [], results => {

	    console.log(start + ' ' + end + ' ' + results.length);

	    for (var result of results) {
		var item = result[0];
		var contextVisit = result[1];
		addContextRow(
		    contextTbody, item.title, item.url,
		    new Date(contextVisit.visitTime).toLocaleString(),
		    contextVisit.visitId == visit.visitId
		);
	    }
	});
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
