# API Registry - GETTESTED-V4

## Projet

- **Application frontend** : `C:\Users\baptiste\Documents\Dev\Getskills\GETTESTED-V4`
- **Template de reference (lecture seule, NE JAMAIS MODIFIER)** : `C:\Users\baptiste\Documents\Dev\Getskills\Minimal_JavaScript_v7.6.1\next-js`
- **API Symfony** : `C:\Users\baptiste\Documents\Dev\Getskills\API-GETTESTED-V4`
- **Port dev frontend** : 3033
- **Base URL API** : definie par `NEXT_PUBLIC_SERVER_URL` dans `.env`
- **Tous les endpoints sont prefixes par `/api`**

## Regles de developpement

1. **Ne JAMAIS modifier le template** `Minimal_JavaScript_v7.6.1/next-js` - c'est une source de verite en lecture seule
2. **Toujours travailler dans** `GETTESTED-V4`
3. **Consulter le template** pour les patterns, composants et conventions
4. **Consulter ce fichier** pour les formats API attendus
5. **Relations API Platform** : les ManyToOne s'envoient en **IRI** (`/api/countries/FR`, `/api/languages/fr`)
6. **Embeddables** (Address, Price, Counterparty) : s'envoient en **objet imbrique**
7. **PATCH** : toujours avec `Content-Type: application/merge-patch+json`
8. **Dates** : format `YYYY-MM-DD` pour les dates, ISO 8601 pour les datetime

---

## Enums

### CivilityEnum
| Valeur | Label |
|--------|-------|
| `M` | Monsieur |
| `MME` | Madame |
| `MLLE` | Mademoiselle |
| `AUTRE` | Autre |

### GenderEnum
| Valeur | Label |
|--------|-------|
| `MASCULIN` | Masculin |
| `FEMININ` | Feminin |
| `AUTRE` | Autre |
| `NON_SPECIFIE` | Non specifie |

### PlatformRoleEnum
| Valeur |
|--------|
| `USER` |
| `ADMIN` |

### InstituteMembershipRole
| Valeur |
|--------|
| `OWNER` |
| `ADMIN` |
| `EXAMINATOR` |
| `STAFF` |

### PaymentMethod
| Valeur |
|--------|
| `STRIPE` |
| `BANK_TRANSFER` |

### InvoiceBusinessType
| Valeur |
|--------|
| `B2B` |
| `B2C` |

---

## Embeddables

### Address
```json
{
  "address1": "string|null",
  "address2": "string|null",
  "zipcode": "string(20)|null",
  "city": "string|null",
  "countryCode": "string(2)|null"
}
```

### Price
```json
{
  "amount": "float",
  "currency": "string(3)"
}
```

### Counterparty (factures)
```json
{
  "name": "string",
  "email": "string",
  "address": "string",
  "city": "string",
  "zipcode": "string",
  "countryCode": "string(2)",
  "vatNumber": "string|null",
  "siren": "string|null",
  "siret": "string|null"
}
```

---

## AUTHENTIFICATION

### POST /api/auth/login/
- **Body** : `{ "email": "...", "password": "..." }`
- **Retourne** : `{ "token": "jwt_token" }`
- **Auth** : Non

### POST /api/auth/register
- **Body (groups: user:write:register)** :
```json
{
  "email": "string (required, unique)",
  "password": "string (required, min 8)",
  "civility": "M|MME|MLLE|AUTRE (required)",
  "firstname": "string (required, max 100)",
  "lastname": "string (required, max 100)",
  "avatar": "string|null",
  "gender": "MASCULIN|FEMININ|AUTRE|NON_SPECIFIE|null",
  "phone": "string|null",
  "phoneCountryCode": "string(5)|null",
  "address": { ... },
  "birthday": "YYYY-MM-DD|null",
  "nativeCountry": "/api/countries/XX|null",
  "nationality": "/api/countries/XX|null",
  "firstlanguage": "/api/languages/xx|null"
}
```
- **Retourne (groups: user:read:self)** : objet User complet
- **Auth** : Non

### POST /api/auth/forgot-password
- **Body** : `{ "email": "..." }`
- **Retourne** : `{ "message": "..." }` (toujours 200)
- **Auth** : Non

### POST /api/auth/reset-password/{token}
- **Body** : `{ "newPassword": "..." }` (min 8 chars)
- **Retourne** : `{ "message": "..." }`
- **Auth** : Non

### POST /api/auth/verify-email/{token}
- **Body** : aucun
- **Retourne** : `{ "message": "..." }`
- **Auth** : Non

---

## USER

### GET /api/users/me/
- **Retourne (groups: user:read:self)** :
```json
{
  "id": "uuid",
  "email": "string",
  "avatar": "string|null",
  "civility": "M|MME|MLLE|AUTRE",
  "gender": "MASCULIN|FEMININ|AUTRE|NON_SPECIFIE|null",
  "firstname": "string",
  "lastname": "string",
  "phone": "string|null",
  "phoneCountryCode": "string|null",
  "address": {
    "address1": "string|null",
    "address2": "string|null",
    "zipcode": "string|null",
    "city": "string|null",
    "countryCode": "string(2)|null"
  },
  "birthday": "YYYY-MM-DD|null",
  "nativeCountry": {
    "code": "FR",
    "alpha3": "FRA",
    "nameOriginal": "France",
    "nameEn": "France",
    "nameFr": "France",
    "flag": "...",
    "demonymFr": "Francais",
    "demonymEn": "French"
  },
  "nationality": { ... },
  "firstlanguage": {
    "code": "fr",
    "nameOriginal": "Francais",
    "nameEn": "French",
    "nameFr": "Francais"
  },
  "isVerified": true,
  "isActive": true,
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "emailVerifiedAt": "datetime|null",
  "platformRole": "USER|ADMIN"
}
```
- **Auth** : IS_AUTHENTICATED_FULLY

### PATCH /api/users/me/
- **Content-Type** : `application/merge-patch+json`
- **Body (groups: user:write:self)** :
```json
{
  "civility": "M|MME|MLLE|AUTRE",
  "gender": "MASCULIN|FEMININ|AUTRE|NON_SPECIFIE|null",
  "firstname": "string",
  "lastname": "string",
  "email": "string",
  "phone": "string|null",
  "phoneCountryCode": "string(5)|null",
  "avatar": "string|null",
  "birthday": "YYYY-MM-DD|null",
  "firstlanguage": "/api/languages/fr|null",
  "nativeCountry": "/api/countries/FR|null",
  "nationality": "/api/countries/FR|null",
  "address": {
    "address1": "string|null",
    "address2": "string|null",
    "zipcode": "string|null",
    "city": "string|null",
    "countryCode": "string(2)|null"
  }
}
```
- **Retourne** : meme format que GET /api/users/me/
- **Auth** : IS_AUTHENTICATED_FULLY
- **Note** : changer l'email declenche une re-verification

### GET /api/users (Admin)
- **Auth** : ROLE_PLATFORM_ADMIN
- **Filtres** : email (exact), firstname (partial), lastname (partial), platformRole (exact), isActive (bool), isVerified (bool)
- **Pagination** : 30/page

### GET /api/users/{id} (Admin)
- **Auth** : ROLE_PLATFORM_ADMIN

### PATCH /api/users/{id} (Admin)
- **Auth** : ROLE_PLATFORM_ADMIN
- **Body (groups: user:write:admin)** : `{ "isActive": bool, "platformRole": "USER|ADMIN" }`

### DELETE /api/users/{id} (Admin, soft delete)
- **Auth** : ROLE_PLATFORM_ADMIN

---

## COUNTRY

### GET /api/countries
- **Filtres** : code (exact), nameFr (partial), nameEn (partial)
- **Retourne** : `[{ "code": "FR", "alpha3": "FRA", "nameOriginal": "...", "nameEn": "...", "nameFr": "...", "flag": "...", "demonymFr": "...", "demonymEn": "..." }]`

### GET /api/countries/{code}
- **Retourne** : objet Country + langues parlees

---

## LANGUAGE

### GET /api/languages
- **Filtres** : code (exact), nameFr (partial)
- **Retourne** : `[{ "code": "fr", "nameOriginal": "...", "nameEn": "...", "nameFr": "..." }]`

### GET /api/languages/{code}
- **Retourne** : objet Language

---

## ASSESSMENT

### GET /api/assessments
- **Filtres** : label (partial), ref (exact), isInternal (bool)
- **Retourne (groups: assessment:read)** : id, label, ref, isInternal, parent, children, levels, skills

### GET /api/assessments/{id}

### POST /api/assessments
- **Auth** : ROLE_PLATFORM_ADMIN
- **Body** : `{ "label": "...", "ref": "...", "isInternal": bool }`

### PATCH /api/assessments/{id}
- **Auth** : voter ASSESSMENT_EDIT

### DELETE /api/assessments/{id}
- **Auth** : voter ASSESSMENT_DELETE

### POST /api/institutes/{instituteId}/assessments
- **Auth** : IS_AUTHENTICATED_FULLY

---

## EXAM

### GET /api/exams
- **Filtres** : label (partial), isWritten (bool), isOption (bool)
- **Retourne** : id, label, isWritten, isOption, coeff, nbrQuestions, duration, successScore, assessment, level, skills, price

### GET /api/exams/{id}

### POST /api/exams
- **Auth** : ROLE_PLATFORM_ADMIN
- **Body** : `{ "label": "...", "isWritten": bool, "isOption": bool, "assessment": "uuid", ... }`

### POST /api/assessments/{assessmentId}/exams
- **Auth** : IS_AUTHENTICATED_FULLY

### PATCH /api/exams/{id}
- **Auth** : voter ASSESSMENT_EDIT sur assessment parent

### DELETE /api/exams/{id}
- **Auth** : voter ASSESSMENT_DELETE sur assessment parent

---

## LEVEL

### GET /api/levels
- **Filtres** : label (partial), ref (exact)
- **Retourne** : id, label, ref, description

### POST /api/levels
- **Auth** : ROLE_PLATFORM_ADMIN

### PATCH /api/levels/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

### DELETE /api/levels/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

---

## SKILL

### GET /api/skills
- **Filtres** : label (partial)
- **Retourne** : id, label, description, parent, children

### POST /api/skills
- **Auth** : ROLE_PLATFORM_ADMIN

### PATCH /api/skills/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

### DELETE /api/skills/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

---

## INSTITUTE

### GET /api/institutes
- **Filtres** : label (partial)
- **Retourne** : id, label, siteweb, socialNetworks, address, vatNumber, siren, siret, legalForm, shareCapital, rcsCity

### GET /api/institutes/{id}

### POST /api/institutes
- **Auth** : IS_AUTHENTICATED_FULLY
- **Body** : `{ "label": "...", "address": { ... }, ... }`

### PATCH /api/institutes/{id}
- **Auth** : voter INSTITUTE_EDIT

### DELETE /api/institutes/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

---

## SESSION

### GET /api/sessions
- **Filtres** : validation (exact: DRAFT, PUBLISHED, etc.)
- **Retourne** : id, start, end, limitDateSubscribe, placesAvailable, validation, assessment, level, institute, scheduledExams, enrollments

### GET /api/sessions/{id}

### GET /api/institutes/{instituteId}/sessions
- **Auth** : IS_AUTHENTICATED_FULLY

### POST /api/institutes/{instituteId}/sessions
- **Auth** : IS_AUTHENTICATED_FULLY
- **Body** : `{ "start": "datetime", "end": "datetime", "assessment": "uuid", ... }`

### PATCH /api/sessions/{id}
- **Auth** : voter SESSION_EDIT
- **Body (groups: session:update)** : start, end, limitDateSubscribe, placesAvailable

### PATCH /api/sessions/{id}/transition
- **Auth** : voter SESSION_TRANSITION
- **Body** : `{ "transition": "publish|cancel|..." }`

### DELETE /api/sessions/{id} (soft delete)
- **Auth** : voter SESSION_DELETE

### POST /api/sessions/{sessionId}/enroll
- **Auth** : IS_AUTHENTICATED_FULLY
- **Retourne** : EnrollmentSession

---

## ENROLLMENT

### GET /api/enrollments/{id}
- **Auth** : voter ENROLLMENT_VIEW
- **Retourne** : id, registrationDate, information, user, session, enrollmentExams, invoices

### DELETE /api/enrollments/{id}
- **Auth** : voter ENROLLMENT_CANCEL

### GET /api/sessions/{sessionId}/enrollments
- **Auth** : IS_AUTHENTICATED_FULLY

### GET /api/enrollment-exams/{id}
- **Auth** : voter ENROLLMENT_EXAM_VIEW

### PATCH /api/enrollment-exams/{id}/score
- **Auth** : voter ENROLLMENT_EXAM_SCORE
- **Body** : `{ "finalScore": number|null }`

---

## INVOICE

### GET /api/invoices (Admin)
- **Auth** : ROLE_PLATFORM_ADMIN

### GET /api/invoices/{id}
- **Auth** : voter INVOICE_VIEW

### GET /api/institutes/{instituteId}/invoices
- **Auth** : IS_AUTHENTICATED_FULLY

### POST /api/institutes/{instituteId}/invoices
- **Auth** : IS_AUTHENTICATED_FULLY
- **Body** : seller (Counterparty), buyer (Counterparty), businessType, lines, etc.

### PATCH /api/invoices/{id}
- **Auth** : voter INVOICE_EDIT

### PATCH /api/invoices/{id}/issue
- **Auth** : voter INVOICE_ISSUE
- **Note** : genere numero facture, date et PDF

---

## INVOICE LINE

### GET /api/invoices/{invoiceId}/lines

### POST /api/invoices/{invoiceId}/lines
- **Body** : `{ "label": "...", "quantity": 1, "unitPriceHT": float, "tvaRate": 20, "exam": "uuid|null" }`

### PATCH /api/invoice-lines/{id}

### DELETE /api/invoice-lines/{id}

---

## PAYMENT

### GET /api/payments/{id}
- **Auth** : voter PAYMENT_VIEW

### GET /api/invoices/{invoiceId}/payments

### POST /api/invoices/{invoiceId}/payments
- **Body** : `{ "amount": float, "currency": "EUR", "paymentMethod": "STRIPE|BANK_TRANSFER" }`

### PATCH /api/payments/{id}/complete

### PATCH /api/payments/{id}/fail

### PATCH /api/payments/{id}/refund

---

## MEMBERSHIP

### GET /api/institutes/{instituteId}/memberships
- **Auth** : IS_AUTHENTICATED_FULLY

### POST /api/institutes/{instituteId}/memberships
- **Auth** : IS_AUTHENTICATED_FULLY
- **Body** : `{ "user": "uuid", "role": "OWNER|ADMIN|EXAMINATOR|STAFF" }`

### PATCH /api/memberships/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

### DELETE /api/memberships/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

---

## ASSESSMENT OWNERSHIP

### GET /api/institutes/{instituteId}/ownerships
- **Auth** : IS_AUTHENTICATED_FULLY

### POST /api/institutes/{instituteId}/ownerships
- **Auth** : ROLE_PLATFORM_ADMIN
- **Body** : `{ "assessment": "uuid", "ownershipType": "...", "relationshipDate": "datetime" }`

### PATCH /api/ownerships/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

### DELETE /api/ownerships/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

---

## EXAM PRICING

### GET /api/institutes/{instituteId}/exam-pricings
- **Auth** : IS_AUTHENTICATED_FULLY

### POST /api/institutes/{instituteId}/exam-pricings
- **Body** : `{ "exam": "uuid", "price": { "amount": float, "currency": "EUR" }, "isActive": true }`

### PATCH /api/exam-pricings/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

### DELETE /api/exam-pricings/{id}
- **Auth** : ROLE_PLATFORM_ADMIN

---

## SCHEDULED EXAM

### GET /api/sessions/{sessionId}/scheduled-exams

### POST /api/sessions/{sessionId}/scheduled-exams
- **Body** : `{ "startDate": "datetime", "room": "string|null", "address": { ... }, "exam": "uuid" }`

### PATCH /api/scheduled-exams/{id}
- **Auth** : voter SCHEDULED_EXAM_EDIT

### DELETE /api/scheduled-exams/{id}
- **Auth** : voter SCHEDULED_EXAM_DELETE
