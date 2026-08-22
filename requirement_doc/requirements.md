# AEI Students Upload Portal

## Purposes
This is a web app which runs on desktop browsers. Authorised Education Institution (AEI) will access this web app (portal) to perform the following tasks.

1. Upload student records to the portal using an Excel template (Original Path).
2. Review errors in upload records and put correction.
3. Provide 'Authorized Signatory' on individual students.

This web app is only a prototype to illustrate new features listed below.
- A. An additional path which AEI user will pick a single programme, and then upload student records are linked to the selected programme
- B. Enhanced functional to review error uploaded student records, and to provide a shortcut of correction by picking another programme from the subgrid.
- C. Enhanced course addition to the student at authorised signature.

## Operation Logic of Student Upload
1. AEI user lands in First Page and select the institute.
2. after 1., user is directed to Upload Summary page.
    - view previous upload batches
    - or click 'Upload File' button to start the upload journey.
3. after 2. user choose between 'Same course for all Students' (alternate path of upload) or 'Multiple course - Multiple students' (original path of upload)
#### upload student records by Alternate Path
4. If user picks 'Same course for all Students' in 3. user is directed to Upload Programme Selection page
    - user has to pick the AEI programme for the upcoming file.
    - then the user uploads a file (populated data in an Excel/ CSV).
5. in the backend, the web app
    - stores each row of the file into  'upload students' table
    - if all attributes of 'upload students' table row match with a row in 'master students' table, nmc_rowstatus is updated to 'Success'. 
    - else it's updated to 'Failed', and mark the mistatch in fields nmc_error1description to nmc_error5description, say
        - programme of the upload record does not match with the row in 'Master Students' table, and that's the first error. Then write 'Programme does not match with organization's record.' into field nmc_error1description.
        - First name of the upload record does not match with the row in 'Master Students' table, and that's the second error. Then write 'First name does not match with organization's record.' into field nmc_error2escription.
6. after all file lines are processed in 4., portal moves to Upload Result page, showing attributes of the upload batch.
    - successful rows are listed in 'Uploaded Records' subgrid.
    - failed rows are listed in 'Error Records' subgrid.
7. 3 ways to allow the user to rectify the failed records in 'Error Records' subgrid.
    a. user can pick another programme in the 'Error Records' subgrid and resubmit that row.
    b. user can selct another programme at the top of 'Error Records' subgrid, select all records and then resubmit all records.
    c. user can click 'View Details' and move to the View Details page to see the info and errors underneath each field, make corrections and resubmit the record.
#### upload student records by Original Path
8. If user picks 'Multiple course - Multiple students' in 3. user is directed to Upload-OriginalPath page
    - user has to pick the Institue Code, and optionally select Programme and Academic Route
        - candidates of drop-down are taken from programmes table.
    - then the user uploads a file (populated data in an Excel/ CSV).
9. in the backend, the web app
    - stores each row of the file into  'upload students' table
    - if all attributes of 'upload students' table row match with a row in 'master students' table, nmc_rowstatus is updated to 'Success'. 
    - else it's updated to 'Failed', and mark the mistatch in fields nmc_error1description to nmc_error5description, for example:
        - programme of the upload record does not match with the row in 'Master Students' table, and that's the first error. Then write 'Programme does not match with organization's record.' into field nmc_error1description.
        - First name of the upload record does not match with the row in 'Master Students' table, and that's the second error. Then write 'First name does not match with organization's record.' into field nmc_error2escription.
10. after all file lines are processed in 4., portal moves to Upload Result page, showing attributes of the upload batch.
    - successful rows are listed in 'Uploaded Records' subgrid.
    - failed rows are listed in 'Error Records' subgrid.
11. 3 ways to allow the user to rectify the failed records in 'Error Records' subgrid.
    a. user can pick another programme in the 'Error Records' subgrid and resubmit that row.
    b. user can selct another programme at the top of 'Error Records' subgrid, select all records and then resubmit all records.
    c. user can click 'View Details' and move to the View Details page to see the info and errors underneath each field, make corrections and resubmit the record.

## Operation Logic of Authorized Signatory
to be updated.

## Generate Notes
- No user authentication and identification access management for this webapp
- This web app is not responsive
- Do not show 'NMC'. Replace NMC logo and shortform by 'Prototype'
- links in the page header and footer are not needed.
