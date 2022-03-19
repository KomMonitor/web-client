Downloaded from: https://github.com/t16h05008/leaflet-easyPrint
Based on https://github.com/alfredott/leaflet-easyPrint/tree/output-modes (see https://github.com/rowanwins/leaflet-easyPrint/pull/92)

I wanted to use this library to not only export images to the file system, but also to only get them programmatically (for reporting).
This change was implemented by alfredott, but the PR never got accepted. So I threw out the old version and use this one instead.
There are some breaking API changes, but since the plugin is only used in one place these should be fixed.
Also did some more adjustments.