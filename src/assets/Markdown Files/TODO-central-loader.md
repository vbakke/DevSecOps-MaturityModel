
## Doing


## Next
- Heatmap: Fix: asterisk marks when modified
  - ViewController needs to know about changes vs temp storage
- Heatmap: Local Storage details
  - Go though responsibility to SectorViewController
    - What is the responsibility?
    - What functions are outside responsibility?
    - What functionality should be within  responsibility?
    - Move SectorViewController to ...
  - General tidy
  - Remove unnecessary console logs
- Move page components to ./pages/...
  
## Later
### Mapping
- Mapping: Refactor to adhere to new data structure. (Page currently broken)
### Teams
- Teams: Refactor to adhere to new data structure. (Page currently broken)
- Teams: Allow editing teams names in browser
- Teams: Store teams names in localstorage
- Teams: Export teams YAML from teams page
- Teams: View timeline for a team (?)
### Matrix
- Matrix: Fix markdown rendering
- Matrix: Add a Close/Back button
- Matrix: Brushup layout of details page
- Matrix: Remember filters, when moving back from details
### Heatmap:
- Heatmap: meta-yaml: If progress definition is missing, default to 0% + 100% 
- Heatmap: Revert to boolean checkboxes, if definition is only 0% and 100%
- Heatmap: Read previous local storage for backwards compatibility 
### Dependency graph
- Dependency graph: Add to CircularHeatmap Details
- Dependency graph: Make it clickable
## Documentation
- Doc: Update `Usage`
- Doc: Update `README.md`
- Doc: Update `About Us`
- Doc: Update `Development.md`
- Doc: Update `INSTALL.md`
## Misc
- Fix dependsOn that is uuid (e.g. 83057028-0b77-4d2e-8135-40969768ae88)
- Move META_FILE constant from data service to main app
- Filter: tags: Fix update on SPACE key (trouble)
- Heatmap, Card: Add Complete-symbol per activity
- Check if loader can be optimized by load in yaml in parallel
## Align DSOMM-data and DSOMM
- DSOMM-data: Sort linear list of activities (sorted by dim, level)
- DSOMM-data: Update generated filename and data structure to adhere to this new DSOMM standard
- DSOMM-data: Include version number in generated yaml file
- DSOMM: Read latest "generated.yaml" from DSOMM-data's github repo, to check for any new releases

# Done
- Heatmap: Export TeamProgress yaml
- Heatmap: Fix: Update map when teams are selected
- Store TeamProgress to localStorage
- Load localStorage TeamProgress
- Load TeamProgress yaml
- Refactor Circular Heatmap
- Add validation for meta.yaml, progress step: include 0% and 100%
- Load YAML progress
- Navigate to activity-description without site reload
- Refactor Dependecy graph
- Refactor activity-description
- Make sure loader.load() only runs once (even with navigations)
- Handle parsing errors, like Circular Heatmap
- Filter: Make filters for subdimensions
- Matrix: toggle chips
- Matrix: updateActivitesBeingDisplayed()
- Matrix: dataloader.getLevels(): Return only max levels from yaml
- Matrix: ngInit
- Make unittest for activity-store
- Make unittest for ignore
- Handle 'ignore:true' on Category and Dimension
- Handle 'ignore:true' on Activity
- Handle 'ignore:true' on dimension or categories
- Load multiple Activity files
- Better error msg handling in load Yaml
- Make 1st draft of Activity model
- Load Activities
- Substitute refs
- Load Yaml

For details and dates, please see the [GitHub log](https://github.com/vbakke/DevSecOps-MaturityModel/commits/experiment/).

## User tracking
The Experimental edition, and the Experimental edition only, uses Grafana Frontend to log the console log to catch bugs, especially from mobile devices. 

Geolocation is not enabled, so no user identifiable data is stored.

You may block this debug logging by using an ad-blocker. 