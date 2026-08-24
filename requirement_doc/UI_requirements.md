# AEI Students Upload Portal

This document depcists UI requirements of each page of the web app (portal), and more importantly the field mappings and the logic of navigation across the pages.

- The pages listed below faciltate two major requirements in @requirements.md of /requirement_doc:
    - A. An additional path which AEI user will pick a single programme, and then upload student records are linked to the selected programme
    - B. Enhanced functional to review error uploaded student records, and to provide a shortcut of correction by picking another programme from the subgrid.

- the elements of each page must follow the diagram with name specified. Diagrams are stored in /requirement_doc/diagrams/
- spacing and layout of elements of each page should be consistent when user navigates across pages.
- for the colour scheme, follow https://www.nmc.org.uk/education/approved-programmes/

## AEIportallandingpage.png
- This is the landing page - First Page of localhost:8008
- Need purple squared tiles and white right arrow in each.
- When user clicks 'Upload student records' tile, he is directed to FirstPage.png
- No URL for other purple tiles. 

## FirstPage.png
- This is the landing page - First Page
- This is the start of the user journey. Firstly the user has to select an institute from the drop-down list.
- Candidates of the drop-down list are made up of concatenate of Institute Name + ' - ' + Institute Code
    - distinct list of instiute name, institeu code is shown in the drop-down list, extracting data from programmes table

## UploadSummary.png
- This is the second page - Upload Summary page
- Consists of
  - Change button to go back to the first page to select another institute
  - a button to Upload file
  - Upload Summary text box. It shows nothing if there's no previous upload, or to show successful or list of errors of most recent upload.
  - Advance Search button is grey-out
  - 'Search' function is disabled as this is a portotype
  - Subgrid consists of the following columns
    - BatchID
    - Requested On (British Summer Time (BST) in DD/MM/YYYY hh:mm AM/PM format)
    - AEI (institute name)
    - Uploaded By (value is always User1)
    - File (file name containing student records)
    - Total Records
    - Successes (no. of records with no error)
    - Error (no. of record with errors)
    - Status (value is 'Failed' if there's >= 1 record with error)
  - The subgrid only shows upload history for the currently selected institute (the one
    named in "You are logged in as ... / <institute>") - switching institute (via Change,
    or arriving with a different institute in the URL) shows that institute's own history,
    never another institute's.
  - The selected institute must always carry forward correctly through every navigation
    that returns to this page - Upload file, Upload Path Selection, Upload Programme
    Selection/Upload-OriginalPath, and every resubmit flow (bulk, single-row, and View
    Details). None of them should ever land back here with "no institute selected" while
    an institute was in fact selected at the start of the journey.
    - down arrow button with drop-down box value 'View Details'

## UploadPathSelection.png
This page is the page after user clicks 'Upload File' button in Upload Summary Page. Name it as Upload Selection page
- Consists of a read-only text box with guidance. Follow exact the wordings at development
- Two purple square buttons
    - Same Course for all Students, which leads to alternate path of upload
    - Multiple course - multiple students, which leads to the original path of upload

## UploadProgrammeSelection.png
This page is the next page after user clicks 'Same Course...' button in Upload Summary Page. It's named as Upload Programme Selection page. This is the start of alternate path of upload.
- user has to select a single programme (nmc_aeiprogrammetitle from Programmes table) in the drop-down box.
- Candidates of the drop-down box are programmes offered by the selected institute (nmc_aeiprogrammetitle from Programmes table). Do not include programmes of other institutes.

#### Additional elements:
- to add a field to allow user to select a file for upload.
- once a file is picked, pressing Uplaod button to upload the selected file and process the records in it.
- if the file fails one of the checks in requirements.md's "Error handling at file upload" section, the
  matching error message is shown underneath the file-upload icon (not processed) - see "File upload error
  display" below.

## Upload-OriginalPath.png
This page is the next page after user clicks 'Multiple courses...' button, and is the starting point of the original path of upload.
- User is mandated to select the institute code (does not show institute name).
- Programme and Academic Route drop-down boxes are optional.

#### Additional elements:
- to add a field to allow user to select a file for upload.
- once a file is picked, pressing Uplaod button to upload the selected file and process the records in it.
- if the file fails one of the checks in requirements.md's "Error handling at file upload" section, the
  matching error message is shown underneath the file-upload icon (not processed) - see "File upload error
  display" below.

#### File upload error display (both Upload Programme Selection and Upload-OriginalPath)
- The error message appears directly underneath the file-upload icon/filename row, in the same red text
  style used for field errors on the View Details page.
- The message is whatever the backend returns for the failure (see requirements.md's "Error handling at
  file upload" - corrupted/unreadable file, no data rows, or wrong column headers each have their own exact
  wording).
- Picking a different file, or changing the programme/institute selection above it, clears the message so a
  stale error doesn't linger once the user has changed what they're about to upload.
- A successful upload navigates to Upload Result as normal; no error message is shown in that case.

## UploadResult.png
- Once the records in the file are processed in either original path or alternate path, the user is navigated to this Upload Result page automatically. (i.e. from either Upload Programme Selection page or )
- 'Back to Upload Summary' leads to Upload Summary page
- upper half of this page shows the attributes of upload, defined in Upload Summary page
- 'Upload Records' subgrid lists the sucessfully upload records. It shows at most 4 rows but infinite scroll allows user to read the rest of the records without the need to click a button to see the next 4 rows.
- 'Error Records' subgrid lists the failed upload records. It shows at most 4 rows but infinite scroll allows user to read the rest of the records without the need to click a button to see the next 4 rows.

## ErrorRecordsSubgrid.png

#### Enhancement 1 - underneath 'Error Records' title - bulk upload with rectified programme
- Underneath the subgrid's title 'Error Records' there are
    - a checkbox to select all individual records in the subgrid
    - Revised Programme drop-down box shows all available programmes of an institute.
        - concatenate nmc_trainingtype, nmc_programme, nmc_academicroute, nmc_qualificationlevel, nmc_aeiprorammenametitle with hyphen in between - refer to the layout only in ErrorRecordsSubgridSingleSelection.png
    - Once a programme is selected from the drop-down box and then click 'Submit' button, all individual records are uploaded with the programme.
        - Once done, user is directed to Upload Summary page, and sees a new record for the recent submission.

#### Enhancement 2 - Error Records subgrid
- Below it is an expanded subgrid which facilitates user to read more attributes, and to pick another programe for resubmission.
- Per-row checkboxes were removed after business review (2026-08-23) as redundant with
  each row's own Revised Programme + Resubmit controls. The "select all" checkbox above
  the subgrid (Enhancement 1) is the only remaining selection control for the bulk
  Revised Programme + Submit action - it now toggles the bulk selection between every
  row in the subgrid and none, rather than checking/unchecking individual rows.
- The Error Records subgrid consists of the following columns
    - Line number (row number in the Excel file; no column header)
    - Name (concatenate nmcpin, hyphen, first name, last name)
    - NMC PIN (nmcpin)
    - Created On (upload time in BST)
    - Message Type (always 'Error')
    - Type Error (always 'Severe')
    - Status Reason (always 'Failed')
    - Programme (concatenate nmc_trainingtype, nmc_programme, nmc_academicroute, nmc_prorammename with hyphen in between)
    - Training Type (nmc_trainingtype)
    - Course Code (nmc_programme)
    - Academic Route (nmc_academicroute)
    - Revised Programme
        - A drop down box listing the institute's distinct nmc_aeiprogrammetitle
          values (same candidate list as Upload Programme Selection's HEI
          Programme drop-down); single choice selection. Shows programme
          titles rather than the training type/course code/academic route
          concatenation, so the user can pick the right HEI programme by name.
    - Resubmit button
        - Once the resubmit button is pressed, it triggers the backend to process the record, and then directs the user to Upload Summary page, and sees a new record for the recent submission.
    - Drop-down button (consists of View Details, Delete)
        - View Details - direct to View Details page
        - Delete - drop the invidivual row; no redo

## ViewDetails.png
- It is accessed by clicking 'View Details' in the drop-down box of Error Records subgrid.
- It consists of 4 tabs listed below with field mappings with the attributes in the upload file.
- the spacing betwene the fields could be expanded to show the error message underneath the upper field. The colour of the error message is red.
- each tab should be in the same length, up to the tab with most fields.
- underneath the tabs there's a button to go back to previous Page, or to Resubmit
- All fields are editable.
- Resubmit takes the user to Upload Summary for the record's institute - resolved fresh from
  the backend's response to the resubmit, not from what the page loaded with. This matters
  specifically when the correction was to the Institute Code field itself (tab 3): the
  institute name shown when the page first loaded reflects the *original, wrong* code, so
  Upload Summary must use the corrected institute, not the stale one.

#### tab 1: 1. Student Details
- NMC PIN - nmc_nmcpin
- Title - nmc_nmctitlename
- First Name - nmc_firstname
- Last Name - nmc_lastname (directly underneath First Name)
- Middle Name - blank (no backing field; editable but not saved)
- Maiden Name - nmc_maidenname
- Date of Birth - transform nmc_dateofbirth to YYYY-MM-DD format
- Gender - nmc_gender
- Natoinality - nmc_country
- Country of Birth - nmc_countryofbirthname (directly underneath Nationality)

#### tab 2: 2. Student Address
- Address Line 1 - nmc_addressline1
- Address Line 2 - nmc_addressline2
- Address Line 3 - nmc_addressline3
- City - nmc_city
- Postcode - nmc_postcode
- Country - nmc_countryname

#### tab 3: 3. Programme Information
- Institute Code - nmc_traininginstitutecode (editable - lets the user correct
  a mistake made in the uploaded file)
- Training type - nmc_trainingtype
- NMC Programme - nmc_programme
- Academic route - nmc_academicroute
- Course Start Date - nmc_coursestartdate
- Course End Date - nmc_courseenddate
- Training Examination Pass Date - nmc_trainingexampassdate

Each field shows its own mismatch error underneath it, same as every other
tab (e.g. if the uploaded NMC Programme doesn't match the master record, the
error appears under the NMC Programme field specifically, not as one combined
message).

#### tab 4: 4. Previous Institute
- no field

