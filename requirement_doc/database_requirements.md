# Database table requirements for AEI Students Upload Portal

following tables are needed to fulfil the logic and meet the demonstration purpose

#cardinality between data subjects
- institute (1) <-> (1..n) programme
- programme (1) <-> (1..n) master student
- programme (1) <-> (1..n) upload batch
- upload file (1) <-> (1..n) upload student
- upload student (1) <-> (1) master student
- upload file (1) <-> (1) upload batch

## table: programmes
- candidates of drop-down boxes of insititutes, programmes, and for lookup by master students and upload students.
- Table's columns are
    - nmc_traininginstitutecode e.g. 1315
    - nmc_traininginstitutecodename e.g. 'University of Chester'
    - nmc_trainingtype e.g. R
    - nmc_trainingtypename e.g. 'Pre-registration nursing, Nursing Associate and SCPHN programmes'
    - nmc_programme e.g. SC1
    - nmc_programmename e.g. 'Pre-registration nursing - Child'
    - nmc_academicroute e.g. 'B Nurs (Hons)'
    - nmc_qualificationlevel e.g. A
    - nmc_qualificationlevelname e.g. Apprenticeship
    - nmc_aeiprogrammetitle e.g. BN (Hons) Children's Nursing
- also includes system attributes for primary keys, foreign keys
- pre-populate with AEI_programmes.csv in /requirement_doc/sample_data at table creation.


## table: master students
- It contains the master students for verification of uploaded student records.
- Table's columns are
    - nmc_nmcpin that's the NMC PIN (identifier) e.g. 26H0883E
    - nmc_nmctitlename	e.g. Miss
    - nmc_firstname	e.g. Magdalena
    - nmc_maidenname e.g. DEWAINE
    - nmc_lastname e.g. AGUILAR GUAYANAY
    - nmc_dateofbirth e.g. 19800412 in YYYYMMDD format
    - nmc_gender e.g. M/F
    - nmc_nationalityname e.g. England
    - nmc_countryofbirthname e.g. Britian
    - nmc_email	e.g. rose@hotmail.com
    - nmc_addressline1 e.g. 2 Marlowe Mews
    - nmc_addressline2 e.g. Worthing
    - nmc_addressline3 e.g. Kent
    - nmc_city e.g. Woodford
    - nmc_postcode e.g. ME7 1EJ; no address lookup verification is needed at insertion/ storage
    - nmc_countryname e.g. England
    - nmc_traininginstitutecode	e.g. 1315
    - nmc_trainingtype e.g. R
    - nmc_programme e.g. AN1
    - nmc_academicroute	e.g. 'BSc (Hons)'
    - nmc_coursestartdate e.g. 19800412 in YYYYMMDD format
    - nmc_courseenddate	e.g. 19800412 in YYYYMMDD format
    - nmc_trainingexampassdate e.g. 19800412 in YYYYMMDD format
    - nmc_institutecode	same as nmc_traininginstitutecode
    - nmc_trainingstartdate	e.g. 19800412 in YYYYMMDD format
    - nmc_trainingcompletiondate e.g. 19800412 in YYYYMMDD format
- also includes system attributes for primary keys, foreign keys
- pre-populate with master_students.csv in /requirement_doc/sample_data at table creation.    

## table: upload students
- It stores the records of the uploaded file.
- It contains the attributes of master students table, plus the following attributes for storing the upload processing status and error(s) of individual records
    - nmc_rowupload time e.g. YYYY-MM-DD hh:mm:ss
    - nmc_rowstatus e.g. Success/ Failed
    - nmc_error1description e.g. 'Programme does not match with organization's record.'
    - nmc_error2description e.g. 'First name does not match with organization's record.'
    - nmc_error3description e.g. 'Country does not match with organization's record.'
    - nmc_error4description
    - nmc_error5description
- also includes system attributes for primary keys, foreign keys
- does not pre-populate any data at table creation.

## table: upload batches
- It stores the upload batch's status, which are extracted by the upper half of Upload Results page
- its attributes are:
    - nmc_uploadbatchtime e.g. YYYY-MM-DD hh:mm:ss
    - nmc_uploadbatchid e.g. 23 as a running number
    - nmc_uploadby
    - nmc_institutecode: it's the code of the selected instituate at the beginning of upload journey
    - nmc_programme: it's the code of the selected programme, or doesn't populate if the records are uploaded by the original path.
    - nmc_academicroute: it's the academic route of the selected programme, or doesn't populate if the records are uploaded by the original path.
    - nmc_totalrecords e.g. 15 is the number of records in the file
    - nmc_totalsuccessrecords e.g. 11 is the number of successfully uploaded records
    - nmc_totalfailedrecords e.g. 15 is the number of failed upload records

## table: master applicants
- It contains the master applicants for management of authorized signatories
- Table's columns are
    - nmc_pin
    - nmc_lastname
    - nmc_firstname
    - nmc_regexpirydate
    - nmc_addedby
    - nmc_createdon
    - nmc_institutecode
    - nmc_institutename
    - nmc_aeiprogrammetitle
    - nmc_trainingtypecode
    - nmc_programmecode
    - nmc_academiclevel
    - nmc_qualificationroute
    - nmc_registerpart1
    - nmc_registerpart2
    - nmc_registerpart3
    - nmc_practicetype1
    - nmc_practicetype2
    - nmc_practicetype3
    - nmc_active
    - nmc_course1trainingtypecode
    - nmc_course1programmecode
    - nmc_course1academiclevel
    - nmc_course1qualificationroute
    - nmc_course2trainingtypecode
    - nmc_course2programmecode
    - nmc_course2academiclevel
    - nmc_course2qualificationroute
    - nmc_course3trainingtypecode
    - nmc_course3programmecode
    - nmc_course3academiclevel
    - nmc_course3qualificationroute
    - nmc_course4trainingtypecode
    - nmc_course4programmecode
    - nmc_course4academiclevel
    - nmc_course4qualificationroute
    - nmc_course5trainingtypecode
    - nmc_course5programmecode
    - nmc_course5academiclevel
    - nmc_course5qualificationroute

- also includes system attributes for primary keys, foreign keys
- pre-populate with data from /requiremnt_doc/sample_data/masterapplicants.csv at table creation.

## table: audit tables
- It contains the change history of the applicant
- Table's columns are
    - nmc_pin
    - nmc_lastname
    - nmc_firstname
    - nmc_regexpirydate
    - nmc_addedby
    - nmc_modifiedon
    - nmc_attributechanged
    - nmc_previousvalue
    - nmc_newvalue
- do not pre-load any data at app startup    



