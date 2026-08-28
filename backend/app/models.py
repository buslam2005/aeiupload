from sqlmodel import Field, SQLModel


class Programme(SQLModel, table=True):
    __tablename__ = "programmes"

    id: int | None = Field(default=None, primary_key=True)
    nmc_traininginstitutecode: str
    nmc_traininginstitutecodename: str
    nmc_trainingtype: str
    nmc_trainingtypename: str
    nmc_programme: str
    nmc_programmename: str
    nmc_academicroute: str
    nmc_qualificationlevel: str
    nmc_qualificationlevelname: str
    nmc_aeiprogrammetitle: str


class MasterStudent(SQLModel, table=True):
    __tablename__ = "master_students"

    nmc_nmcpin: str = Field(primary_key=True)
    nmc_nmctitlename: str
    nmc_firstname: str
    nmc_maidenname: str | None = None
    nmc_lastname: str
    nmc_dateofbirth: str
    nmc_gender: str
    nmc_nationalityname: str
    nmc_countryofbirthname: str
    nmc_email: str
    nmc_addressline1: str
    nmc_addressline2: str | None = None
    nmc_addressline3: str | None = None
    nmc_city: str
    nmc_postcode: str
    nmc_countryname: str
    nmc_traininginstitutecode: str
    nmc_trainingtype: str
    nmc_programme: str
    nmc_academicroute: str
    nmc_coursestartdate: str
    nmc_courseenddate: str
    nmc_trainingexampassdate: str
    nmc_trainingstartdate: str
    nmc_trainingcompletiondate: str


class UploadBatch(SQLModel, table=True):
    __tablename__ = "upload_batches"

    nmc_uploadbatchid: int | None = Field(default=None, primary_key=True)
    nmc_uploadbatchtime: str
    nmc_uploadby: str
    nmc_institutecode: str
    nmc_programme: str | None = None
    nmc_academicroute: str | None = None
    nmc_filename: str
    nmc_totalrecords: int
    nmc_totalsuccessrecords: int
    nmc_totalfailedrecords: int


class UploadStudent(SQLModel, table=True):
    __tablename__ = "upload_students"

    id: int | None = Field(default=None, primary_key=True)
    upload_batch_id: int = Field(foreign_key="upload_batches.nmc_uploadbatchid")
    nmc_linenumber: int

    nmc_nmcpin: str | None = None
    nmc_nmctitlename: str | None = None
    nmc_firstname: str | None = None
    nmc_maidenname: str | None = None
    nmc_lastname: str | None = None
    nmc_dateofbirth: str | None = None
    nmc_gender: str | None = None
    nmc_nationalityname: str | None = None
    nmc_countryofbirthname: str | None = None
    nmc_email: str | None = None
    nmc_addressline1: str | None = None
    nmc_addressline2: str | None = None
    nmc_addressline3: str | None = None
    nmc_city: str | None = None
    nmc_postcode: str | None = None
    nmc_countryname: str | None = None
    nmc_traininginstitutecode: str | None = None
    nmc_trainingtype: str | None = None
    nmc_programme: str | None = None
    nmc_academicroute: str | None = None
    nmc_coursestartdate: str | None = None
    nmc_courseenddate: str | None = None
    nmc_trainingexampassdate: str | None = None
    nmc_trainingstartdate: str | None = None
    nmc_trainingcompletiondate: str | None = None

    nmc_rowuploadtime: str
    nmc_rowstatus: str
    nmc_error1description: str | None = None
    nmc_error2description: str | None = None
    nmc_error3description: str | None = None
    nmc_error4description: str | None = None
    nmc_error5description: str | None = None


class MasterApplicant(SQLModel, table=True):
    __tablename__ = "master_applicants"

    nmc_pin: str = Field(primary_key=True)
    nmc_lastname: str
    nmc_firstname: str
    nmc_regexpirydate: str
    nmc_addedby: str
    nmc_createdon: str
    nmc_institutecode: str
    nmc_institutename: str
    nmc_aeiprogrammetitle: str
    nmc_trainingtypecode: str
    nmc_programmecode: str
    nmc_academiclevel: str
    nmc_qualificationroute: str
    nmc_registerpart1: str
    nmc_registerpart2: str | None = None
    nmc_registerpart3: str | None = None
    nmc_practicetype1: str | None = None
    nmc_practicetype2: str | None = None
    nmc_practicetype3: str | None = None
    nmc_active: str

    # Course 1 mirrors the top-level course fields above at data creation - see
    # developmentplan_AS.md Assumption 2. Courses 2-5 are populated by "Add
    # Course" (max 4 additional) and purged by "Remove Course".
    nmc_course1trainingtypecode: str
    nmc_course1programmecode: str
    nmc_course1academiclevel: str
    nmc_course1qualificationroute: str
    nmc_course2trainingtypecode: str | None = None
    nmc_course2programmecode: str | None = None
    nmc_course2academiclevel: str | None = None
    nmc_course2qualificationroute: str | None = None
    nmc_course3trainingtypecode: str | None = None
    nmc_course3programmecode: str | None = None
    nmc_course3academiclevel: str | None = None
    nmc_course3qualificationroute: str | None = None
    nmc_course4trainingtypecode: str | None = None
    nmc_course4programmecode: str | None = None
    nmc_course4academiclevel: str | None = None
    nmc_course4qualificationroute: str | None = None
    nmc_course5trainingtypecode: str | None = None
    nmc_course5programmecode: str | None = None
    nmc_course5academiclevel: str | None = None
    nmc_course5qualificationroute: str | None = None


class AuditRecord(SQLModel, table=True):
    __tablename__ = "audit_records"

    id: int | None = Field(default=None, primary_key=True)
    nmc_pin: str
    nmc_lastname: str
    nmc_firstname: str
    nmc_regexpirydate: str
    nmc_addedby: str
    nmc_modifiedon: str
    nmc_attributechanged: str
    nmc_previousvalue: str | None = None
    nmc_newvalue: str | None = None
