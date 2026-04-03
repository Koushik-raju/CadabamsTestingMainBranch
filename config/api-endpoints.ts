import { BASE_URL, BASE_URL_HOS, BACKEND_URL } from './env';

export const endpoints = {
  // Auth
  GET_LOGIN_INFO: `${BASE_URL}/crm_lead/login`,
  OTP_SEND_URL: `${BASE_URL}/crm_lead/send_otp`,
  LEAD_CREATION: `${BASE_URL}/mobile/signup`,
  GET_USER_DETAILS: `${BASE_URL}/restapi/1.0/object/crm.lead`,
  DELETE_ACCOUNT: `${BASE_URL}/delete/account`,
  SEND_SIGN_UP_QUESTIONS: `${BASE_URL}/mobile/signup/details`,

  // Appointments
  GET_APPOINTMENT_DETAILS: `${BASE_URL}/appointment`,
  GET_PREVIOUS_APPOINTMENT: `${BASE_URL}/restapi/1.0/object/slot.booking`,
  BOOK_INDIVIDUAL_APPOINTMENT: `${BASE_URL}/book_appointment`,
  CONFIRM_PACKAGE_BOOKING: `${BASE_URL}/book/package-appointment`,
  FOLLOWUP_ENDPOINT: `${BASE_URL}/fetch/slot/details/followup`,
  CANCEL_APPOINTMENT: `${BASE_URL}/cancel_appointment`,
  GET_TIME_SLOT: `${BASE_URL}/restapi/1.0/object/slot.booking`,
  GET_SLOT_PRICE: `${BASE_URL}/get/slot_price`,

  // Packages
  GET_PACKAGE_LIST: `${BASE_URL}/restapi/1.0/object/service.child.master?domain=[]&fields=['id','name']`,
  GET_ALL_PACKAGES: `${BASE_URL}/restapi/1.0/object/package.package`,
  GET_FILTERED_PACKAGES: `${BASE_URL}/restapi/1.0/object/package.package`,
  BOOK_A_PACKAGE: `${BASE_URL}/book_package`,
  CONFIRM_THE_PACKAGE: `${BASE_URL}/restapi/1.0/object/lead.booked.package`,
  MANAGE_BOOKED_PACKAGES: `${BASE_URL}/manage/package`,
  BOOK_PACKAGE: `${BASE_URL}/book_package`,

  // Products
  GET_PRODUCT_LIST: `${BASE_URL}/restapi/1.0/object/package.product.lines?domain=[]&fields=['product_id']`,

  // Doctors
  GET_DOCTOR_LIST: `${BASE_URL}/get/doctors/testing`,

  // Locations
  GET_LOCATION_CENTER: `${BASE_URL}/restapi/1.0/object/campus.master?domain=[('book_appointment','=',True)]&fields=['id','name', 'city','latitude','longitude']`,
  GET_CENTER_DETAILS: `${BASE_URL}/restapi/1.0/object/campus.master`,
  GET_SUB_CAMPUS: `${BASE_URL}/restapi/1.0/object/mindtalk.campus?domain=[]&fields=[]&user_id=1`,

  // Filters
  GET_SPECIALTY_LIST: `${BASE_URL}/restapi/1.0/object/speciality.master?domain=[]&fields=['id','name']`,
  GET_ILLNESS_LIST: `${BASE_URL}/restapi/1.0/object/primary.tag?domain=[]&fields=['id','name']`,
  GET_RELATIONSHIP_MASTER: `${BASE_URL}/restapi/1.0/object/relationship.master?domain=[]&fields=['id','name']`,
  GET_LANGUAGES: `${BASE_URL}/restapi/1.0/object/language.master?domain=[]&fields=['name','code']&user_id=1`,
  GET_AGE_PREFERENCES: `${BASE_URL}/restapi/1.0/object/age.preference?domain=[]&fields=['name']&user_id=1`,
  GET_SPECIALITIES: `${BASE_URL}/restapi/1.0/object/speciality.master?domain=[]&fields=[]&user_id=1`,
  GET_ILLNESSES: `${BASE_URL}/restapi/1.0/object/primary.tag?domain=[]&fields=['id','name']&user_id=1`,
  GET_CNS: `${BASE_URL}/restapi/1.0/object/cns.preference?domain=[]&fields=['id','name']&user_id=1`,
  GET_CITIES: `${BASE_URL}/restapi/1.0/object/city.city?domain=[]&fields=[]&user_id=1`,
  GET_AREAS: `${BASE_URL}/restapi/1.0/object/area.area?domain=[]&fields=[]&user_id=1`,

  // Payments
  GET_PAYMENT_VALS: `${BASE_URL}/mobile/payment`,
  PHONEPE_PAYMENT_URL: `${BASE_URL}/mobile/payment/phonepe`,
  GET_PAYMENT_ORDER_DETAILS: `${BASE_URL}/get/payment/reference`,
  GET_PAYMENT_STATUS: `${BASE_URL}/mobile/status/api`,
  PAYMENT_CALLBACK: `${BASE_URL}/mobile/payment/callback`,
  RAZORPAY_PAYMENT_URL: `${BASE_URL}/razorpay/payment`,
  RAZORPAY_ORDER_URL: `${BASE_URL}/razorpay/order`,
  RAZORPAY_PAYMENT_CALLBACK: `${BASE_URL}/razorpay/order/callback`,

  // Chat / AI
  saveChat: `${BACKEND_URL}/add-data`,
  fetchChat: `${BACKEND_URL}/get-chats`,
  saveLog: `${BACKEND_URL}/add-log`,
  saveAssessment: `${BACKEND_URL}/add-assessment`,
  fetchAssessment: `${BACKEND_URL}/get-assessments`,
  getAssignments: `${BACKEND_URL}/get-assignments-id`,

  // Notifications
  GET_NOTIFICATION_DETAILS: `${BASE_URL}/get/notification`,
  PUT_NOTIFICATION_DETAILS: `${BASE_URL}/enable/notification`,

  // Video
  GET_VIDEO_CALL_ID: `${BASE_URL}/get/roomid`,

  // Hospital (prescriptions)
  GET_MEDICINE_LINE_ITEMS: `${BASE_URL_HOS}/restapi/1.0/object/oeh.medical.prescription.line`,
} as const;

export type EndpointKey = keyof typeof endpoints;
