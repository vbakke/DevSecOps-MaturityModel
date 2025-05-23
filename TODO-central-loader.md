# ToDo


## Doing
- Load TeamProgress yaml
    - Store teamProgress as part of activityStore under each activity
    - How to deal with deleted progress??? (Do later)
- Refactor Circular Heatmap
    - show progress for each activity on the slider
    - show progress for each activity in thje sector

## Next
- Load TeamProgress yaml
    - Store in localStorage
    - Handle boolean for backwards compatibility
    - Merge localStorage and YAML
- Progress Slider
    - Data model, contains date, so warning about downgrade can show date
    - Handle when previous value does not have a date (backwards compatibility)
    - Catch close to save new progresses
- Store TeamProgress to localStorage
- Load localStorage TeamProgress
- Export TeamProgress yaml
- Filters
    - filter teams
    - filter none => all



## Later
- Add validation for meta.yaml, progress step: include 0% and 100%, and increacing values
- Merge in experiment's way of generating circ heat
- Fix dependsOn that is uuid (e.g. 83057028-0b77-4d2e-8135-40969768ae88)
- Sort linear list of activities (sorted by level, dim)
- Move META_FILE constant from data service to main app
- Filter: tags: Fix update on SPACE key (trouble)

# Done
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