# histcontext

Histcontext lets you see the surrounding history for a webpage you've visited in
the past!  You can also see all past recorded visits to a webpage.  This
WebExtension has only been tested on Firefox.  Ideally it would show the context
you in the browser's history window &ndash; unfortunately I don't think that's
possible with WebExtensions, so the UI is based on a toolbar popup that lets you
browse your history.

PRs welcome.  The code is a bit hacky and UI-centered...

The latest version is **0.9.0**.

## Current limitations
* 4 hrs. before & after
* Only shows up to 15 items of context before & after.  This is good enough for me; however the ideal would be infinite context.