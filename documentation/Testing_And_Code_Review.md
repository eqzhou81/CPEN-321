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
| **GET /api/discussions** | [backend/tests/unmock/discussions.unmocked.test.ts#L47](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L47) | [backend/tests/mock/discussions.mocked.test.ts#L76](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L76) | `discussionModel`, `userModel`, `Socket.IO`, `mongoose` |
| **GET /api/discussions/:id** | [backend/tests/unmock/discussions.unmocked.test.ts#L70](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L70) | [backend/tests/mock/discussions.mocked.test.ts#L230](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L230) | `discussionModel.findById`, `userModel.findById` |
| **POST /api/discussions** | [backend/tests/unmock/discussions.unmocked.test.ts#L120](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L120) | [backend/tests/mock/discussions.mocked.test.ts#L320](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L320) | `discussionModel.create`, `Socket.IO`, `auth.middleware` |
| **POST /api/discussions/:id/messages** | [backend/tests/unmock/discussions.unmocked.test.ts#L170](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L170) | [backend/tests/mock/discussions.mocked.test.ts#L380](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L380) | `discussionModel.findById`, `discussionModel.postMessage`, `Socket.IO` |
| **GET /api/discussions/my/discussions** | [backend/tests/unmock/discussions.unmocked.test.ts#L220](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/unmock/discussions.unmocked.test.ts#L220) | [backend/tests/mock/discussions.mocked.test.ts#L470](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/mock/discussions.mocked.test.ts#L470) | `discussionModel.findByUserId`, `auth.middleware` |


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
| `useCase_BrowseDiscussions_Success()` | **Browse Existing Discussions** | User navigates to the *Community Discussions* screen, views a list of existing discussions, and can open multiple discussion details and return to the list successfully. | [DiscussionsTest.kt#L110](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L110) |
| `useCase_CreateandViewDiscussion_Success()` | **Create and View Discussion (Main Success Path)** | User clicks “Create Discussion,” enters a valid topic and description, submits successfully, and can view the newly created discussion | [DiscussionsTest.kt#L230](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L230) |
| `useCase_CreateDiscussion_EmptyTopic_Failure()` | **Create Discussion – Empty Topic Validation** | Submitting without a topic triggers validation. Discussion should *not* be created; either an error snackbar appears or navigation returns to the list. | [DiscussionsTest.kt#L360](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L360) |
| `useCase_CreateDiscussion_TopicTooLong_Failure()` | **Create Discussion – Topic Exceeds Character Limit** | Submitting a topic over 100 characters shows a validation error (“too long”) and does *not* create the discussion. | [DiscussionsTest.kt#L460](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L460) |
| `useCase_CreateDiscussion_DescriptionTooLong_Failure()` | **Create Discussion – Description Exceeds Limit** | Submitting a description over 500 characters triggers validation. Either a snackbar appears or user remains on form; no invalid discussion is created. | [DiscussionsTest.kt#L570](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L570) |
| `useCase_PostMessage_Success()` | **Post Message in Discussion** | User opens a discussion, types a message, submits it, and the message appears instantly in the discussion thread. | [DiscussionsTest.kt#L720](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/DiscussionsTest.kt#L720) |
| `liveUpdate_CreateDiscussion_AppearsToOtherUsers()` | **Real-Time Discussion Creation (User B → User A)** | User B creates a new discussion on another device. Within ≤ 60 seconds, User A’s device receives and displays the new discussion automatically without refresh. | [LiveDiscussionsTest.kt#L120](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/LiveDiscussionsTest.kt#L120) |
| `liveUpdate_RapidMessages_AllAppearToOtherUsers()` | **Real-Time Multi-Message Synchronization** | User B sends three messages rapidly. User A verifies that all 3 messages appear in order and in real time within the open discussion thread. | [LiveDiscussionsTest.kt#L260](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/LiveDiscussionsTest.kt#L260) |
| `useCase_GenerateQuestions_Success()` | **Generate Questions – Main Success Path** | User opens a saved job → clicks *Generate Questions* → backend fetches job details and produces both Behavioral and Technical question sets. Both buttons become visible, and user can navigate to each question list. | [QuestionGenerationTest.kt#L50](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L50) |
| `useCase_GenerateQuestions_NoJobDescription()` | **Failure Scenario 4a – Missing Job Description** | Backend returns an error indicating that no description is available. UI remains on the *Job Details* screen and displays a message: “Unable to generate questions. Job description is missing or incomplete.” | [QuestionGenerationTest.kt#L200](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L200) |
| `useCase_GenerateQuestions_OpenAIFailure()` | **Failure Scenario 5a – OpenAI API Failure** | Behavioral questions fail to generate. System shows an error message (“Unable to generate behavioral questions”) and continues to generate technical questions. Behavioral button not shown. | [QuestionGenerationTest.kt#L300](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L300) |
| `useCase_GenerateQuestions_NoBehavioralQuestions()` | **Failure Scenario 5b – No Behavioral Questions Returned** | OpenAI returns an empty result. The app displays a warning (“No behavioral questions could be generated for this job type”) and continues to technical question generation. Behavioral button is not displayed. | [QuestionGenerationTest.kt#L400](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L400) |
| `useCase_GenerateQuestions_LeetCodeFailure()` | **Failure Scenario 5c – LeetCode API Failure** | Technical question generation fails. UI displays “Unable to generate coding questions at this time.” Behavioral questions (if generated) remain visible. | [QuestionGenerationTest.kt#L500](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L500) |
| `useCase_GenerateQuestions_NoCodingQuestions()` | **Failure Scenario 5d – No Coding Questions Returned** | Backend returns no relevant coding questions. App displays “No relevant coding questions found for this job type.” Technical button is not visible. | [QuestionGenerationTest.kt#L600](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L600) |
| `useCase_GenerateQuestions_ProcessingFailure()` | **Failure Scenario 6a – Question Processing Error** | Question generation completes, but post-processing fails. UI shows “Questions generated but could not be processed.” In E2E tests, if backend succeeds, test still passes. | [QuestionGenerationTest.kt#L700](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/QuestionGenerationTest.kt#L700) |
| `useCase_PasteJobPosting_Success()` | **Use Case 1 – Paste Job Posting (Success)** | User selects *Paste Text* mode, inputs job title, company, and description. The app parses and stores these fields, displaying the job entry in the list. | [JobManagementTest.kt#L50](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L50) |
| `useCase_PasteJobPostingLink_Success()` | **Use Case 2 – Paste Job Link (Success)** | User enters a valid job posting URL. The backend scrapes and normalizes job data, then displays the new job entry in the dashboard list. | [JobManagementTest.kt#L200](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L200) |
| `useCase_ViewJobApplicationDetails_Success()` | **Use Case 3 – View Job Details (Success)** | User clicks on a stored job in the dashboard. The *Job Details* screen opens with the title, company, and description displayed. | [JobManagementTest.kt#L300](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L300) |
| `useCase_DeleteJobApplication_Success()` | **Use Case 4 – Delete Job Application (Success)** | User opens a job’s details, clicks *Delete*, confirms, and the job is removed from the list. The dashboard refreshes and no longer shows the deleted entry. | [JobManagementTest.kt#L400](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L400) |
| `useCase_PasteJobPosting_EmptyText_Failure()` | **Failure Scenario – Empty Text Input** | User attempts to submit an empty job posting. The “Add to Portfolio” button remains disabled or submission fails silently. No job is created and the user remains on the dashboard. | [JobManagementTest.kt#L500](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L500) |
| `useCase_PasteJobPostingLink_InvalidUrl_Failure()` | **Failure Scenario – Invalid URL** | User inputs a malformed URL (e.g., “not-a-valid-url”). The submission is rejected, no scraping occurs, and the user stays on the job list without any new entry created. | [JobManagementTest.kt#L600](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e/JobManagementTest.kt#L600) |


---

## 5. Automated code review results

#### 5.1 Commit Hash
The hash of the commit on the **main** branch where Codacy ran:

#### 5.2 Issues Breakdown by Category
The number of unfixed issues per Codacy category (copied from the **“Issues breakdown”** table in the Codacy *Overview* page):

#### 5.3 Issues Breakdown by Code Pattern
The number of unfixed issues per Codacy code pattern (copied from the **“Issues”** page):

#### 5.4 Justification for Unfixed Issues

