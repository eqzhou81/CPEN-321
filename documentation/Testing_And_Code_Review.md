# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
|                                                           |


## 2. Back-end test specification : APIs

### 2.1 Locations of your back-end test and instructions to run them. 

#### 2.1.1 API Test Locations and Mocked Components


| **Interface** | **Describe Group Location (No Mocks)** | **Describe Group Location (With Mocks)** | **Mocked Components** |
|----------------|---------------------------------------|------------------------------------------|------------------------|
| **GET /api/discussions** | [backend/tests/unmock/discussion.unmocked.test.ts#L47](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussion.unmocked.test.ts#L47) | [backend/tests/mock/discussion.mocked.test.ts#L76](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussion.mocked.test.ts#L76) | `discussionModel.findAll`, `userModel.findById`, `Socket.IO`, `mongoose` |
| **GET /api/discussions/:id** | [backend/tests/unmock/discussion.unmocked.test.ts#L150](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussion.unmocked.test.ts#L150) | [backend/tests/mock/discussion.mocked.test.ts#L230](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussion.mocked.test.ts#L230) | `discussionModel.findById`, `userModel.findById` |
| **POST /api/discussions** | [backend/tests/unmock/discussion.unmocked.test.ts#L220](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussion.unmocked.test.ts#L220) | [backend/tests/mock/discussion.mocked.test.ts#L320](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussion.mocked.test.ts#L320) | `discussionModel.create`, `Socket.IO`, `auth.middleware` |
| **POST /api/discussions/:id/messages** | [backend/tests/unmock/discussion.unmocked.test.ts#L260](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussion.unmocked.test.ts#L260) | [backend/tests/mock/discussion.mocked.test.ts#L380](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussion.mocked.test.ts#L380) | `discussionModel.findById`, `discussionModel.postMessage`, `Socket.IO` |
| **GET /api/discussions/my/discussions** | [backend/tests/unmock/discussion.unmocked.test.ts#L310](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussion.unmocked.test.ts#L310) | [backend/tests/mock/discussion.mocked.test.ts#L470](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussion.mocked.test.ts#L470) | `discussionModel.findByUserId`, `auth.middleware` |
| **POST /api/jobs** | [backend/tests/unmock/jobs.unmocked.test.ts#L84](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/jobs.unmocked.test.ts#L84) | [backend/tests/mock/job.controller.test.ts#L31](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/job.controller.test.ts#L31) | `jobApplicationModel.create`, `mongoose`, `axios`, `puppeteer`, `cheerio` |
| **GET /api/jobs** | [backend/tests/unmock/jobs.unmocked.test.ts#L57](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/jobs.unmocked.test.ts#L57) | [backend/tests/mock/job.controller.test.ts#L92](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/job.controller.test.ts#L92) | `jobApplicationModel.findByUserId`, `mongoose` |
| **POST /api/jobs/:id/similar** | [backend/tests/unmock/jobs.unmocked.test.ts#L5](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/jobs.unmocked.test.ts#L5) | [backend/tests/mock/job.controller.test.ts#L150](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/job.controller.test.ts#L150) | `jobSearchService.findSimilarJobs`, `jobApplicationModel.findById`, `mongoose` |
| **POST /api/jobs/scrape** | [backend/tests/unmock/jobs.unmocked.test.ts#L50](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/jobs.unmocked.test.ts#L50) | [backend/tests/mock/job.controller.test.ts#L200](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/job.controller.test.ts#L200) | `jobSearchService.scrapeJobDetails`, `axios`, `cheerio`|
| **GET /api/jobs/statistics** | [backend/tests/unmock/jobs.unmocked.test.ts#L79](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/jobs.unmocked.test.ts#L79) | [backend/tests/mock/job.controller.test.ts#L260](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/job.controller.test.ts#L260) | `jobApplicationModel.count`, `jobApplicationModel.findByUserId`, `mongoose` |
| **POST /api/auth/google** | *(No unmocked version — Google OAuth requires mock environment)* | [backend/tests/mock/auth.controller.test.ts#L15](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/auth.controller.test.ts#L15) | `authService.verifyGoogleToken`, `userModel.findOne`, `userModel.create`, `jsonwebtoken.sign` |
| **POST /api/auth/logout** | *(No unmocked version — Google OAuth requires mock environment)* | [backend/tests/mock/auth.controller.test.ts#L110](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/auth.controller.test.ts#L110) | `authService.invalidateSession`, `mongoose` |
| **POST /api/questions/generate** | [backend/tests/unmock/questions.unmocked.test.ts#L25](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/questions.unmocked.test.ts#L25) | [backend/tests/mock/questions.controller.test.ts#L30](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/questions.controller.test.ts#L30) | `openaiService.generateQuestions`, `jobModel.findById`, `mongoose` |
| **GET /api/questions/:id** | [backend/tests/unmock/questions.unmocked.test.ts#L55](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/questions.unmocked.test.ts#L55) | [backend/tests/mock/questions.controller.test.ts#L80](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/questions.controller.test.ts#L80) | `questionModel.findById`, `mongoose` |
| **POST /api/questions/validate** | [backend/tests/unmock/questions.unmocked.test.ts#L85](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/questions.unmocked.test.ts#L85) | [backend/tests/mock/questions.controller.test.ts#L120](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/questions.controller.test.ts#L120) | `questionValidationService.checkAnswer`, `mongoose` |
| **POST /api/questions/store** | [backend/tests/unmock/questions.unmocked.test.ts#L120](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/questions.unmocked.test.ts#L120) | [backend/tests/mock/questions.controller.test.ts#L160](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/questions.controller.test.ts#L160) | `questionModel.create`, `userModel.updateOne`, `mongoose` |
| **GET /api/questions/my/questions** | [backend/tests/unmock/questions.unmocked.test.ts#L160](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/questions.unmocked.test.ts#L160) | [backend/tests/mock/questions.controller.test.ts#L200](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/questions.controller.test.ts#L200) | `questionModel.findByUserId`, `auth.middleware`, `mongoose` |
| **POST /api/sessions/create** | [backend/tests/unmock/sessions.unmocked.test.ts#L30](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/sessions.unmocked.test.ts#L30) | [backend/tests/mock/sessions.controller.test.ts#L45](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/sessions.controller.test.ts#L45) | `sessionModel`, `questionModel`, `jobApplicationModel`, `openaiService`, `auth.middleware` |
| **GET /api/sessions** | [backend/tests/unmock/sessions.unmocked.test.ts#L43](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/sessions.unmocked.test.ts#L43) | [backend/tests/mock/sessions.controller.test.ts#L58](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/sessions.controller.test.ts#L58) | `sessionModel.findByUserId`, `sessionModel.getSessionStats` |
| **GET /api/sessions/:sessionId** | [backend/tests/unmock/sessions.unmocked.test.ts#L100](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/sessions.unmocked.test.ts#L100) | [backend/tests/mock/sessions.controller.test.ts#L120](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/sessions.controller.test.ts#L120) | `sessionModel.findById`, `questionModel.findById` |
| **PUT /api/sessions/:sessionId/navigate** | [backend/tests/unmock/sessions.unmocked.test.ts#L200](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/sessions.unmocked.test.ts#L200) | [backend/tests/mock/sessions.controller.test.ts#L150](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/sessions.controller.test.ts#L150) | `sessionModel.updateNavigation`, `mongoose` |
| **GET /api/sessions/:sessionId/progress** | [backend/tests/unmock/sessions.unmocked.test.ts#L240](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/sessions.unmocked.test.ts#L240) | [backend/tests/mock/sessions.controller.test.ts#L200](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/sessions.controller.test.ts#L200) | `sessionModel.findById` |
| **DELETE /api/sessions/:sessionId** | [backend/tests/unmock/sessions.unmocked.test.ts#L2199](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/sessions.unmocked.test.ts#L2199) | [backend/tests/mock/sessions.controller.test.ts#L69](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/sessions.controller.test.ts#L69) | `sessionModel.delete` |
| **GET /api/user/profile** | [backend/tests/unmock/user.unmocked.test.ts#L61](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/user.unmocked.test.ts#L61) | [backend/tests/mock/users.controller.test.ts#L45](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/users.controller.test.ts#L45) | `userModel.findById`, `auth.middleware`, `mongoose` |
| **POST /api/user/profile** | [backend/tests/unmock/user.unmocked.test.ts#L100](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/user.unmocked.test.ts#L100) | [backend/tests/mock/users.controller.test.ts#L79](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/users.controller.test.ts#L79) | `userModel.update`, `auth.middleware` |
| **DELETE /api/user/profile** | [backend/tests/unmock/user.unmocked.test.ts#L78](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/user.unmocked.test.ts#L78) | [backend/tests/mock/users.controller.test.ts#L6](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/users.controller.test.ts#L6) | `userModel.delete`, `auth.middleware` |




---

#### 2.1.2 Commit Hash

The tests were executed on the following commit on the `main` branch:



#### 2.1.3 Explanations on how to run the tests

To run all combined tests:
`npm test`

To run all combined tests with coverage:
`npm test`
`npm run coverage:combine`


To run the mocked test suite with coverage:
`npm run test:mocked -- --coverage`


To run the unmocked test suite with coverage:
`npm run test:unmocked -- --coverage`

---

### 2.2 The location of the .yml files that run all your back-end tests in GitHub Actions.

The location of the .yml file : [.github/workflows/backend-tests.yml](https://github.com/eqzhou81/CPEN-321/blob/main/.github/workflows/backend-tests.yml) 

---

### 2.3 Jest coverage report NO MOCKING

---

### 2.4 Jest coverage report WITH MOCKING

---

### 2.5 Jest coverage report WITH AND WITHOUT MOCKING

---


## 3. Back-end test specification : Tests of non-functional requirements

### 3.1 Location of non-funtional requirement tests

The location of tests for response time: [backend/tests/nfr/nfr1-api-response-time.test.ts](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/nfr/nfr1-api-response-time.test.ts) 

The location of tests for data integrity: [backend/tests/nfr/nfr3-data-integrity.test.ts](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/nfr/nfr3-data-integrity.test.ts) 

---

### 3.2 Verification that the requirement was met.


## 4. Front-end test specification

### 4.1. Location of Front-End Test Suite

All front-end tests are located under the following directory: [frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e) 

When running frontend tests please ensure that the build.grade has auth bypassed toggled to true, the VM backend also bypasses authentication.

### 4.2. Test Cases, Expected Behaviors, and Execution Logs

| **Test Function** | **Use Case Verified** | **Expected Behavior / Scenario** | **Location** |
|--------------------|-----------------------|----------------------------------|---------------|
| `useCase_BrowseDiscussions_Success()` | **Browse Existing Discussions** | User navigates to *Community Discussions*, views discussion list, opens multiple discussion details, and returns successfully. | [DiscussionsTest.kt#L110](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L110) |
| `useCase_CreateandViewDiscussion_Success()` | **Create and View Discussion (Main Success Path)** | User creates a discussion with valid topic and description. Submission succeeds and the discussion appears in the list. | [DiscussionsTest.kt#L230](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L230) |
| `useCase_CreateDiscussion_EmptyTopic_Failure()` | **Empty Topic Validation** | Submitting without a topic triggers validation; no discussion is created, and an error snackbar appears. | [DiscussionsTest.kt#L360](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L360) |
| `useCase_CreateDiscussion_TopicTooLong_Failure()` | **Topic Too Long Validation** | Topic exceeding 100 chars shows validation error and prevents submission. | [DiscussionsTest.kt#L460](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L460) |
| `useCase_CreateDiscussion_DescriptionTooLong_Failure()` | **Description Too Long Validation** | Description >500 chars triggers validation; user stays on form; no discussion created. | [DiscussionsTest.kt#L570](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L570) |
| `useCase_PostMessage_Success()` | **Post Message in Discussion** | User sends a message; it appears instantly in the thread. | [DiscussionsTest.kt#L720](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L720) |
| `liveUpdate_CreateDiscussion_AppearsToOtherUsers()` | **Real-Time Discussion Creation (User B → User A)** | Discussion created by User B appears on User A’s screen within 60 seconds, without refresh. | [LiveDiscussionsTest.kt#L120](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/LiveDiscussionsTest.kt#L120) |
| `liveUpdate_RapidMessages_AllAppearToOtherUsers()` | **Real-Time Multi-Message Sync** | Three rapid messages from User B appear sequentially in real time on User A’s thread. | [LiveDiscussionsTest.kt#L260](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/LiveDiscussionsTest.kt#L260) |
| `useCase_GenerateQuestions_Success()` | **Generate Questions (Main Success Path)** | Backend generates both *Behavioral* and *Technical* questions; both buttons appear and navigate correctly. | [QuestionGenerationTest.kt#L50](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L50) |
| `useCase_GenerateQuestions_NoJobDescription()` | **Failure 4a – Missing Job Description** | Displays “Unable to generate questions. Job description is missing.” and remains on *Job Details*. | [QuestionGenerationTest.kt#L200](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L200) |
| `useCase_GenerateQuestions_OpenAIFailure()` | **Failure 5a – OpenAI API Failure** | Shows “Unable to generate behavioral questions.” Continues generating technical ones. | [QuestionGenerationTest.kt#L300](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L300) |
| `useCase_GenerateQuestions_NoBehavioralQuestions()` | **Failure 5b – No Behavioral Questions** | Shows “No behavioral questions could be generated.” Technical questions still appear. | [QuestionGenerationTest.kt#L400](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L400) |
| `useCase_GenerateQuestions_LeetCodeFailure()` | **Failure 5c – LeetCode API Failure** | Displays “Unable to generate coding questions.” Behavioral questions remain visible. | [QuestionGenerationTest.kt#L500](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L500) |
| `useCase_GenerateQuestions_NoCodingQuestions()` | **Failure 5d – No Coding Questions** | Shows “No relevant coding questions found.” Technical button not displayed. | [QuestionGenerationTest.kt#L600](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L600) |
| `useCase_GenerateQuestions_ProcessingFailure()` | **Failure 6a – Processing Error** | Displays “Questions generated but could not be processed.” If backend succeeds, test still passes. | [QuestionGenerationTest.kt#L700](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L700) |
| `useCase_PasteJobPosting_Success()` | **Use Case 1 – Paste Job Posting (Success)** | User pastes job title, company, and description; system parses and lists new job entry. | [JobManagementTest.kt#L50](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L50) |
| `useCase_PasteJobPostingLink_Success()` | **Use Case 2 – Paste Job Link (Success)** | User enters valid URL; backend scrapes and normalizes job data; job appears in dashboard. | [JobManagementTest.kt#L200](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L200) |
| `useCase_ViewJobApplicationDetails_Success()` | **Use Case 3 – View Job Details (Success)** | User clicks a stored job; *Job Details* screen opens with full info. | [JobManagementTest.kt#L300](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L300) |
| `useCase_DeleteJobApplication_Success()` | **Use Case 4 – Delete Job Application (Success)** | User deletes a job and confirms; dashboard refreshes; job removed. | [JobManagementTest.kt#L400](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L400) |
| `useCase_PasteJobPosting_EmptyText_Failure()` | **Failure – Empty Text Input** | Submitting with empty text fails silently; no job created; remains on dashboard. | [JobManagementTest.kt#L500](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L500) |
| `useCase_PasteJobPostingLink_InvalidUrl_Failure()` | **Failure – Invalid URL** | User enters malformed URL; submission rejected; no scraping or job creation. | [JobManagementTest.kt#L600](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L600) |


---

## 5. Automated code review results

#### 5.1 Commit Hash
The hash of the commit on the **main** branch where Codacy ran:

#### 5.2 Issues Breakdown by Category
The number of unfixed issues per Codacy category (copied from the **“Issues breakdown”** table in the Codacy *Overview* page):

#### 5.3 Issues Breakdown by Code Pattern
The number of unfixed issues per Codacy code pattern (copied from the **“Issues”** page):

#### 5.4 Justification for Unfixed Issues

