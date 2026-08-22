# AEI Students Upload Portal

This document depcists UI requirements of each page of the web app (portal), and more importantly the field mappings and the logic of navigation across the pages.

- The pages listed below faciltate two major requirements in @requirements.md of /requirement_doc:
    - A. An additional path which AEI user will pick a single programme, and then upload student records are linked to the selected programme
    - B. Enhanced functional to review error uploaded student records, and to provide a shortcut of correction by picking another programme from the subgrid.

- the elements of each page must follow the diagram with name specified. Diagrams are stored in /requirement_doc/diagrams/
- spacing and layout of elements of each page should be consistent when user navigates across pages.
- for the colour scheme, follow https://www.nmc.org.uk/education/approved-programmes/


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

## Upload-OriginalPath.png
This page is the next page after user clicks 'Multiple courses...' button, and is the starting point of the original path of upload.
- User is mandated to select the institute code (does not show institute name).
- Programme and Academic Route drop-down boxes are optional.

#### Additional elements:
- to add a field to allow user to select a file for upload.
- once a file is picked, pressing Uplaod button to upload the selected file and process the records in it.

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
        - concatenate nmc_trainingtype, nmc_programme, nmc_academicroute, nmc_prorammename with hyphen in between - refer to ErrorRecordsSubgridSingleSelection.png
    - Once a programme is selected from the drop-down box and then click 'Submit' button, all individual records are uploaded with the programme.
        - Once done, user is directed to Upload Summary page, and sees a new record for the recent submission.

#### Enhancement 2 - Error Records subgrid
- Below it is an expanded subgrid which facilitates user to read more attributes, and to pick another programe for resubmission.
- The Error Records subgrid consists of the following columns
    - checkbox in the leftmost of each row
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
        - A drop down box listing all programmes of the institute; single choice selection
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

#### tab 1: 1. Student Details
- NMC PIN - nmc_nmcpin
- Title - nmc_nmctitlename
- First Name - nmc_firstname
- Middle Name - blank
- Maiden Name - nmc_maidenname
- Previou Last Name - blank
- Date of Birth - transform nmc_dateofbirth to YYYY-MM-DD format
- Gender - nmc_gender
- Natoinality - nmc_country

#### tab 2: 2. Student Address
- Address Line 1 - nmc_addressline1
- Address Line 2 - nmc_addressline2
- Address Line 3 - nmc_addressline3
- City - nmc_city
- Postcode - nmc_postcode
- Country - nmc_countryname

#### tab 3: 3. Programme Information
- Training type - nmc_trainingtype
- NMC Programme - nmc_programme
- Academic route - nmc_academicroute
- Course Start Date - nmc_coursestartdate
- Course End Date - nmc_courseenddate
- Training Examination Pass Date - nmc_trainingexampassdate

#### tab 4: 4. Previous Institute
- no field

