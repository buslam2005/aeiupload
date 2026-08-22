from pydantic import BaseModel, ConfigDict


class InstituteOut(BaseModel):
    code: str
    name: str


class ProgrammeChoiceOut(BaseModel):
    nmc_trainingtype: str
    nmc_programme: str
    nmc_academicroute: str
    nmc_programmename: str


class ProgrammeTitleChoiceOut(BaseModel):
    nmc_trainingtype: str
    nmc_programme: str
    nmc_academicroute: str
    nmc_aeiprogrammetitle: str


class UploadStudentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    upload_batch_id: int
    nmc_linenumber: int

    nmc_nmcpin: str | None
    nmc_nmctitlename: str | None
    nmc_firstname: str | None
    nmc_maidenname: str | None
    nmc_lastname: str | None
    nmc_dateofbirth: str | None
    nmc_gender: str | None
    nmc_nationalityname: str | None
    nmc_countryofbirthname: str | None
    nmc_email: str | None
    nmc_addressline1: str | None
    nmc_addressline2: str | None
    nmc_addressline3: str | None
    nmc_city: str | None
    nmc_postcode: str | None
    nmc_countryname: str | None
    nmc_traininginstitutecode: str | None
    nmc_trainingtype: str | None
    nmc_programme: str | None
    nmc_academicroute: str | None
    nmc_coursestartdate: str | None
    nmc_courseenddate: str | None
    nmc_trainingexampassdate: str | None
    nmc_trainingstartdate: str | None
    nmc_trainingcompletiondate: str | None

    nmc_rowuploadtime: str
    nmc_rowstatus: str
    nmc_error1description: str | None
    nmc_error2description: str | None
    nmc_error3description: str | None
    nmc_error4description: str | None
    nmc_error5description: str | None

    # Resolved server-side by joining upload_students' own programme columns
    # against the programmes table - not stored on upload_students itself.
    nmc_programmename: str | None = None

    # Resolved server-side from nmc_traininginstitutecode, same as
    # BatchSummaryOut.institute_name - lets the frontend restore institute
    # context (e.g. after a View Details resubmit) without a second fetch.
    institute_name: str | None = None


class BatchSummaryOut(BaseModel):
    nmc_uploadbatchid: int
    nmc_uploadbatchtime: str
    nmc_uploadby: str
    nmc_institutecode: str
    institute_name: str | None
    nmc_programme: str | None
    nmc_academicroute: str | None
    nmc_filename: str
    nmc_totalrecords: int
    nmc_totalsuccessrecords: int
    nmc_totalfailedrecords: int
    status: str


class BatchDetailOut(BatchSummaryOut):
    uploaded_records: list[UploadStudentOut]
    error_records: list[UploadStudentOut]


class ResubmitWithProgrammeRequest(BaseModel):
    upload_student_ids: list[int]
    nmc_trainingtype: str
    nmc_programme: str
    nmc_academicroute: str


class ResubmitFullRequest(BaseModel):
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
