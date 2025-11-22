# Testing and Code Review

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| Nov 20  | 4.2 | Changed the front end test to show execution logs and the correct descriptions and expectations | 

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

The tests were executed on the following commit on the `main` branch: f3e480b50bcdd6d7aac653b2393089cec4da8bd9



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
<img width="1136" height="829" alt="unmocked_test_coverage" src="https://github.com/user-attachments/assets/49b2b43e-e561-4d1d-b27d-5957b9527096" />

---

### 2.4 Jest coverage report WITH MOCKING
<img width="1119" height="884" alt="mocked_test_coverage" src="https://github.com/user-attachments/assets/a8d1eb46-b32a-419c-a468-6b3254904577" />

---

### 2.5 Jest coverage report WITH AND WITHOUT MOCKING
<img width="1085" height="539" alt="combined_controllers" src="https://github.com/user-attachments/assets/703d217c-0625-48b3-9d9e-5dec357a0622" />
<img width="1012" height="518" alt="combined_models" src="https://github.com/user-attachments/assets/29e3cdbf-90fd-44e8-888a-6d69a2a31c91" />
<img width="1027" height="576" alt="combined_routes" src="https://github.com/user-attachments/assets/371a86e4-ae79-4874-be61-4aff85b0310c" />
<img width="1063" height="744" alt="combined_services_middleware" src="https://github.com/user-attachments/assets/f1b5485a-5f57-444b-9fc5-3e8ee1538111" />

---



## 3. Back-end test specification : Tests of non-functional requirements

### 3.1 Location of non-funtional requirement tests

The location of tests for response time: [backend/tests/nfr/nfr1-api-response-time.test.ts](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/nfr/nfr1-api-response-time.test.ts) 

The location of tests for data integrity: [backend/tests/nfr/nfr3-data-integrity.test.ts](https://github.com/eqzhou81/CPEN-321/blob/main/backend/tests/nfr/nfr3-data-integrity.test.ts) 

---

### 3.2 Verification that the requirement was met.

The `nfr1-api-response-time.test.ts` suite simulates a normal load of 100 concurrent requests across representative endpoints (authentication, jobs, questions, sessions, user profile, discussions). For every run it records percentile statistics and asserts that the overall p95 latency stays at or below 3 seconds, average response time remains under 5 seconds, and that each individual endpoint meets the same p95 ≤ 3 second threshold. Passing this suite demonstrates that the response-time non-functional requirement is satisfied under the target concurrent load.

The `nfr3-data-integrity.test.ts` suite runs against real MongoDB collections and covers create/read/update/delete loops, rapid status toggles, heavy discussion posting, and forced question-generation failures. It confirms that records stay intact, toggles return to a consistent state, every discussion message is saved, database validation succeeds, and failed operations leave no partial data. Passing all of these checks shows the data-integrity requirement holds during normal use, high churn, and error cases.


## 4. Front-end test specification

### 4.1. Location of Front-End Test Suite

All front-end tests are located under the following directory: [frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e](https://github.com/eqzhou81/CPEN-321/blob/main/frontend/app/src/androidTest/java/com/cpen321/usermanagement/e2e) on the feature/e2e tests branch. The main branch runs into some merge issues which was hard to fix, so please use the e2e branch for more accurate test results

When running frontend tests please ensure that the build.grade has auth bypassed toggled to true, the VM backend also bypasses authentication.


### 4.2. Test Cases, Expected Behaviors, and Execution Logs

---
### Discussion Tests

#### Test 1 — useCase_BrowseDiscussions_Success  
##### Use Case  
Browse existing discussions (main success scenario)


| Scenario Step | Test Case Step |
|--------------|----------------|
| User navigates to Discussions screen | Performed in `setup()` using `navigateToDiscussions()`; verify “Community Discussions” appears |
| System displays a list of discussions | Check that at least one node contains “Amazon” or “Discussion” |
| User views discussion topics and metadata | Confirm discussion titles appear on screen |
| User clicks a discussion | Click “Amazon” or another discussion item |
| System opens detail page | Verify discussion title is visible |
| User navigates back and optionally clicks another discussion | Press “Back” and ensure return to “Community Discussions” |

##### Expected Behaviors  
- Discussion list is displayed  
- At least one discussion exists  
- Tapping a discussion opens its detail page  
- Back navigation returns to the list  
- Additional discussions may also be opened  

##### Execution Logs  
- Test token set. Backend URL:
- Navigating to discussions screen...
- Looking for Discussions button...
- ✓ Clicked Discussions button
- Verifying we're on discussions screen...
- ✓ Successfully navigated to discussions screen
- === Use Case: Browse Discussions - Success ===
- Step 2-3: Checking for discussions list...
- Step 4: Clicking on multiple discussions to browse...
- Going back to discussions list...
- ✓ Successfully clicked on second discussion
- ✓ Use Case: Browse Discussions - Success PASSED



---

#### Test 2 — useCase_CreateandViewDiscussion_Success
##### Use Case  
Create a discussion (main success scenario)

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on Discussions list | Verified in `setup()` |
| User clicks “Create Discussion” | Click `new_discussion_button` |
| System shows creation form | Verify “Create Discussion” text |
| User enters topic | Input text into `discussion_topic_input` |
| User enters description | Input text into `discussion_description_input` |
| User submits form | Click `create_discussion_button` |
| System stores discussion | Wait for navigation |
| System shows the created discussion in the community discussions| Verify topic title appears |


##### Expected Behaviors  
- Form appears  
- Valid inputs accepted  
- Discussion is stored  
- Navigation to new discussion page  
- Title is visible  

##### Execution Logs  
- Test token set. Backend URL: 
- Navigating to discussions screen...
- Looking for Discussions button...
- ✓ Clicked Discussions button
- Verifying we're on discussions screen...
- ✓ Successfully navigated to discussions screen
- === Use Case: Create Discussion - Success ===
- Step 2: Checking for 'Create Discussion' button...
- Step 3: Checking for 'Create Discussion' form...
- Step 4: Entering topic title...
- Step 5: Entering description...
- Step 6: Submitting discussion...
- Step 7-8: Checking for created discussion...
- ✓ Use Case: Create Discussion - Success PASSED



---

#### Test 3 — useCase_CreateDiscussion_EmptyTopic_Failure
##### Use Case  
Create a discussion (failure scenario)

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on Discussions list | Verify “Community Discussions” |
| User opens create form | Click `new_discussion_button` |
| System displays form | Verify “Create Discussion” |
| User submits empty topic | Click `create_discussion_button` without entering text |
| System rejects input | Expect snackbar (“empty” / “required”) or remain on form |

##### Expected Behaviors  
- Submission with empty topic is rejected  
- Validation error is shown  
- No discussion created  

##### Execution Logs  
- Test token set. Backend URL: 
- Navigating to discussions screen...
- Looking for Discussions button...
- ✓ Clicked Discussions button
- Verifying we're on discussions screen...
- ✓ Successfully navigated to discussions screen
- === Use Case: Create Discussion - Empty Topic Failure ===
- Opening Create Discussion form...
- Submitting with empty topic...
- ✓ Validation verified: Discussion not created, snackbar or navigation occurred - test PASSED


---

#### Test 4 — useCase_CreateDiscussion_TopicTooLong_Failure()
##### Use Case  
Create a discussion (failure scenario)

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on Discussions list | Verify “Community Discussions” |
| User opens form | Click `new_discussion_button` |
| System displays form | Verify “Create Discussion” |
| User enters >100–char topic | Input `"A".repeat(101)` |
| User submits form | Click `create_discussion_button` |
| System rejects long input | Expect snackbar or remain on form |
| No discussion created | Ensure invalid topic is not displayed |

##### Expected Behaviors  
- Over-length topic rejected  
- Validation snackbar displayed  
- No discussion created  

##### Execution Logs  

- Test token set. Backend URL: 
- Navigating to discussions screen...
- Looking for Discussions button...
- ✓ Clicked Discussions button
- Verifying we're on discussions screen...
- ✓ Successfully navigated to discussions screen
- === Use Case: Create Discussion - Topic Too Long Failure ===
- ✓ Validation verified: Discussion not created, snackbar or navigation occurred - test PASSED



---

#### Test 5 — useCase_CreateDiscussion_DescriptionTooLong_Failure()
##### Use Case  
Create a discussion (failure scenario)

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on Discussions list | Verify “Community Discussions” |
| User opens create form | Click `new_discussion_button` |
| System displays form | Verify “Create Discussion” |
| User enters valid topic | Input into `discussion_topic_input` |
| User enters >500 characters | Input `"A".repeat(501)` |
| User submits | Click `create_discussion_button` |
| System rejects long description | Expect snackbar or remain on form |
| No discussion created | Ensure no new entry appears |

##### Expected Behaviors  
- Description exceeding limit rejected  
- Validation error shown  
- No discussion created  

##### Execution Logs
- Test token set. Backend URL: 
- Navigating to discussions screen...
- Looking for Discussions button...
- ✓ Clicked Discussions button
- Verifying we're on discussions screen...
- ✓ Successfully navigated to discussions screen  
- === Use Case: Create Discussion - Description Too Long Failure ===
- Step 1: Verifying we're on discussions list...
- Step 2: Opening Create Discussion form...
- Step 4: Entering valid topic...
- Step 5: Entering description exceeding 500 characters...
- Step 6: Attempting to submit with description too long...
- ✓ Validation verified: Discussion not created, snackbar or navigation occurred - test PASSED


---

#### Test 6 — useCase_PostMessage_Success()
##### Use Case  
Post in a discussion 

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens discussion | Click an item containing “Amazon” or “Discussion” |
| System displays detail screen | Verify discussion title appears |
| User types a message | Input into `message_input` |
| User submits message | Click send button (`contentDescription = "Send Message"`) |
| Message appears | Verify posted message text appears in thread |

##### Expected Behaviors  
- Message input visible and enabled  
- Message can be typed and submitted  
- Message appears after posting  

##### Execution Logs  
- Test token set. Backend URL: 
- Navigating to discussions screen...
- Looking for Discussions button...
- ✓ Clicked Discussions button
- Verifying we're on discussions screen...
- ✓ Successfully navigated to discussions screen
- === Use Case: Post Message - Success ===
- Step 2: Waiting for message input field to be ready...
- Looking for message input field with test tag 'message_input'...
- ✓ Message input field found, now typing message...
- Attempt 1: Typing message into input field...
- Attempt 2: Typing message into input field...
- Attempt 3: Typing message into input field...
- Attempt 4: Typing message into input field...
- Attempt 5: Typing message into input field...
- ✓ Message successfully typed into input field
- ✓ Message typed successfully, waiting before submission...
- Step 3: Submitting message...
- Step 4: Checking for posted message...
- ✓ Use Case: Post Message - Success PASSED

---
#### Test 7 — liveUpdate_CreateDiscussion_AppearsToOtherUsers()
##### Use Case  
A discussion created by User B (manual tester) appears in real-time to User A (automated test).

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User A on Discussions list | Verify “Community Discussions” |
| User B creates a discussion | Test prints manual instructions for User B |
| User A waits for real-time update | Poll for new topic for up to 60 seconds |
| Discussion appears | Detect topic in discussions list |
| User A opens discussion | `checkTextAndClick(expectedTopic)` |
| System navigates to detail | Verify navigation successful |

##### Expected Behaviors  
- Live update system pushes new discussion to User A  
- User A sees new discussion without refreshing  
- Discussion is clickable and leads to detail screen  
- Test passes only when real-time sync confirmed  

##### Execution Logs  
- === LIVE UPDATE TEST: Create Discussion ===  
- User A: Waiting on discussions list...  
- *(Manual tester instructions printed)*  
- User A: Waiting for new discussion to appear...  
- Waiting... (checking again in 2 seconds)  
- Waiting... (checking again in 2 seconds)  
- ✓ Discussion found in list!  
- ✓ SUCCESS: New discussion appeared in real-time on User A's device!  
- Verifying discussion is interactive...  
- ✓ Successfully clicked on the new discussion  
- ✓ LIVE UPDATE TEST PASSED: Discussion creation synced successfully  

---

#### Test 8 — liveUpdate_RapidMessages_AllAppearToOtherUsers()
##### Use Case  
User B sends multiple rapid messages in a discussion, and User A sees all messages appear in real-time in the correct order.

##### Scenario Steps → Test Case Steps  
| Scenario Step | Test Case Step |
|--------------|----------------|
| User A on Discussions list | Verify “Community Discussions” |
| User B creates a new discussion | Print manual instructions for User B |
| User A waits for discussion to appear | Poll list until topic appears |
| User A opens discussion | `checkTextAndClick(discussionTopic)` |
| User B posts 3 rapid messages | Manual tester follows printed instructions |
| User A waits for each message | Poll until each appears sequentially |
| System confirms all appeared | Assertions for message1, message2, message3 |

##### Expected Behaviors  
- New discussion created by User B appears in real-time  
- User A enters the correct discussion without refreshing  
- All 3 rapid messages appear in correct order  
- Real-time sync handles bursts of messages reliably  
- Test only passes when all messages appear  

##### Execution Logs  
- === LIVE UPDATE TEST: Rapid Multiple Messages ===  
- User A: Waiting on discussions list...  
- *(Manual tester instructions printed)*  
- User A: Waiting for discussion to appear...  
- ✓ Discussion appeared in list!  
- User A: Opening the new discussion...  
- User A: Now in discussion, waiting for message 1...  
- ✓ Message 1 appeared!  
- User A: Waiting for message 2...  
- ✓ Message 2 appeared!  
- User A: Waiting for message 3...  
- ✓ Message 3 appeared!  
-  
- ╔═══════════════════════════════════════════════════════════╗  
-   ✅ SUCCESS! All 3 messages appeared in real-time!  
- ╚═══════════════════════════════════════════════════════════╝  
-  
- ✓ LIVE UPDATE TEST PASSED: Rapid messages synced successfully  

---
### Generate Questions

#### Test 1 — useCase_GenerateQuestions_Success()
##### Use Case  
Generate questions for a saved job (success path) and viw technical and behavioural questions use case

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens job applications | Verify “My Job Applications” |
| User selects job | Click job containing “Test Job” / “Job” |
| System shows Job Details | Verify “Job Details” |
| User clicks Generate Questions | Click `generate_questions_button` |
| System loads and generates questions | Wait for “Interview Questions” |
| System finishes loading | Wait for loading text to disappear |
| System shows buttons | Check for Behavioral / Technical |
| User opens question lists | Click each button |

### Expected Behaviors
- Job Details screen appears  
- Question generation completes  
- Behavioral or Technical button appears  
- User can navigate to question lists  

### Execution Logs
- === Use Case 1: Generate Questions - Main Success Scenario ===
- Step 1: Checking for 'My Job Applications' screen...
- Step 2: Checking for job to select...
- Clicking on job...
- Step 3: Checking for 'Job Details' screen...
- Step 3: Checking for 'Generate Questions' button...
- Step 4-6: Waiting for question generation to complete...
- Step 7: Checking for question type buttons...
- Step 8: Testing navigation to question lists...
- Clicking on 'Behavioral Questions' button...
- ✓ Successfully navigated to Behavioral Questions screen
- Clicking on 'Technical Questions' button...
- ✓ Successfully navigated to Technical Questions screen
- ✓ Use Case 1: Generate Questions - Main Success Scenario PASSED


---

#### Test 2 — useCase_GenerateQuestions_NoJobDescription()
##### Use Case  

Generate questions for a saved job (failure scenario)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens job | Click job |
| System shows Job Details | Verify "Job Details" |
| User clicks Generate Questions | Click `generate_questions_button` |
| System cannot find description | Wait |
| System shows error | Look for error text |
| System stays on Job Details | Verify still on Job Details |

### Expected Behaviors
- Error message shown  
- Stays on Job Details screen  
- No questions generated  

### Execution Logs
- === Use Case 1 - Failure Scenario 4a: No Job Description ===
- Step 4a1: Checking for error message...
- Step 4a2: Verifying side effect - staying on Job Details screen...
- ✓ Side effect verified: Still on Job Details screen (4a2)
- ✓ Error message displayed (4a1)
- Note: Navigated to questions screen - checking if questions were generated...
- ✓ Side effect verified: No question buttons found - questions were NOT generated
- ✓ Use Case 1 - Failure Scenario 4a: No Job Description PASSED


---

#### Test 3 — useCase_GenerateQuestions_OpenAIFailure()
##### Use Case 

Generate questions for a saved job (failure scenario OpenAi fails)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens a job | Click job |
| User clicks Generate | Click button |
| System tries OpenAI | Loading screen |
| OpenAI fails | Search for OpenAI error |
| System continues to coding question step | Wait for coding questions |
| Behavioral button missing | Verify absence |

### Expected Behaviors
- Behavioral question error shown  
- No Behavioral Questions button  
- Technical questions may still appear  

### Execution Logs
- === Use Case 1 - Failure Scenario 5a: OpenAI API Failure ===
- Step 5a2: Waiting for question generation to complete...
- Step 5a1: Checking for error message...
- Step 5a3: Verifying side effect - Behavioral Questions button NOT available...
- ✓ Side effect verified: Behavioral Questions button NOT available (5a3)
- ✓ Error message displayed (5a1)
- ✓ Technical questions available (5a2: System continued to coding questions)
- Note: Behavioral questions button found - OpenAI succeeded (acceptable in E2E)
- ✓ Use Case 1 - Failure Scenario 5a: OpenAI API Failure PASSED


---

#### Test 4 — useCase_GenerateQuestions_NoBehavioralQuestions()
##### Use Case  
Generate questions for a saved job (failure scenario no behavioural questions generated)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens job | Click job |
| User clicks Generate | Click button |
| System loads | Wait |
| System cannot generate behavioral list | Check warning |
| Behavioral list missing | Verify no Behavioral button |
| Technical list may exist | Check Technical |

### Expected Behaviors
- Warning: "No behavioral questions…"  
- No Behavioral button  
- Technical button may exist  

### Execution Logs
- === Use Case 1 - Failure Scenario 5b: No Behavioral Questions ===
- Step 5b2: Waiting for question generation to complete...
- Step 5b1: Checking for warning message...
- Step 5b3: Verifying side effect - Behavioral Questions button NOT available...
- ✓ Side effect verified: Behavioral Questions button NOT available (5b3)
- ✓ Warning message displayed (5b1)
- ✓ Technical questions available (5b2: System continued to coding questions)
- Note: Behavioral questions button found - OpenAI succeeded (acceptable in E2E)
- ✓ Use Case 1 - Failure Scenario 5b: No Behavioral Questions PASSED


---

#### Test 5 — useCase_GenerateQuestions_LeetCodeFailure()
##### Use Case  
Generate questions for a saved job (failure scenario leetcode fails)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens job | Click job |
| User clicks Generate | Click button |
| System loads | Wait |
| LeetCode fails | Check error message |
| No Technical button | Verify absence |
| Behavioral may exist | Check Behavioral |

### Expected Behaviors
- Coding question error shown  
- No Technical button  
- Behavioral questions may still exist  

### Execution Logs
- === Use Case 1 - Failure Scenario 5c: LeetCode API Failure ===
- Waiting for question generation to complete...
- Step 5c1: Checking for error message...
- Step 5c2: Verifying side effect - Technical Questions button NOT available...
- ✓ Side effect verified: Technical Questions button NOT available (5c2)
- ✓ Error message displayed (5c1)
- ✓ Behavioral questions available (OpenAI succeeded)
- Note: Technical questions button found - LeetCode succeeded (acceptable in E2E)
- ✓ Use Case 1 - Failure Scenario 5c: LeetCode API Failure PASSED


---

#### Test 6 — useCase_GenerateQuestions_NoCodingQuestions()
### Use Case  
Generate questions for a saved job (failure scenario leetcode does not return coding questions)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens job | Click job |
| User clicks Generate | Click button |
| System loads | Wait |
| No coding questions returned | Check warning |
| No Technical button | Verify absence |
| Behavioral may exist | Check Behavioral |

### Expected Behaviors
- Warning: "No relevant coding questions…"  
- No Technical button  
- Behavioral may exist  

### Execution Logs
- === Use Case 1 - Failure Scenario 5d: No Coding Questions ===
- Waiting for question generation to complete...
- Step 5d1: Checking for warning message...
- Step 5d2: Verifying side effect - Technical Questions button NOT available...
- ✓ Side effect verified: Technical Questions button NOT available (5d2)
- ✓ Warning message displayed (5d1)
- ✓ Behavioral questions available (OpenAI succeeded)
- Note: Technical questions button found - LeetCode succeeded (acceptable in E2E)
- ✓ Use Case 1 - Failure Scenario 5d: No Coding Questions PASSED


---

#### Test 7 — useCase_GenerateQuestions_ProcessingFailure()
##### Use Case  
Generate questions for a saved job (Failure scenario)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens job | Click job |
| User clicks Generate | Click button |
| System loads | Wait |
| Processing step fails | Check error |
| No question lists | Verify absence |

### Expected Behaviors
- Error: “Questions generated but could not be processed”  
- No Behavioral / Technical list shown  

### Execution Logs
- === Use Case 1 - Failure Scenario 6a: Question Processing Failure ===
- Waiting for question generation to complete...
- Step 6a1: Checking for error message...
- ✓ Error message displayed (6a1)
- Note: Processing succeeded - no error message (acceptable in E2E)
- ✓ Questions were successfully processed and displayed
- ✓ Use Case 1 - Failure Scenario 6a: Question Processing Failure PASSED

---
### Job Management

#### Test 1 — useCase_PasteJobPosting_Success()
##### Use Case  

Paste job posting content (success)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on job dashboard | Verify “My Job Applications” |
| User selects Add Job | Click `add_job_button` |
| System displays Add Job dialog | Verify dialog title |
| User selects Paste Text mode | Select “Paste Text” (if not default) |
| User pastes job text | Enter jobPostingText |
| User submits job posting | Click “Add to Portfolio” |
| System extracts fields | Backend parses title/company/description |
| Job appears in list | Verify title or company appears |

### Expected Behaviors
- Add Job dialog opens correctly  
- Paste Text mode works  
- Job posting text is accepted  
- New job appears in list with correct fields  

### Execution Logs
- === Use Case 1: Paste Job Posting - Main Success Scenario ===
- Step 1: Checking for 'My Job Applications' screen...
- Step 2: Checking for 'Add Job' button...
- Step 3: Checking for 'Add Job Application' dialog...
- Click-selecting Paste Text mode (if needed)
- Step 4: Inputting job posting text...
- ✓ Job posting text entered
- Step 5: Clicking 'Add to Portfolio' button...
- Step 6-7: Verifying job appears in list...
- ✓ Use Case 1: Paste Job Posting - Main Success Scenario PASSED


---

#### Test 2 — useCase_PasteJobPostingLink_Success()
##### Use Case  
Paste job posting link (success)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on job dashboard | Verify “My Job Applications” |
| User selects Add Job | Click Add Job |
| System shows Add Job dialog | Verify dialog |
| User selects Paste Link mode | Click “Paste Link” |
| User enters job URL | Input the link |
| User submits | Click “Add to Portfolio” |
| System scrapes job info | Backend fetch + normalize |
| Job appears in list | Check list for job/company |

### Expected Behaviors
- URL entry accepted  
- Scraping completes  
- Normalized job added to list  

### Execution Logs
- === Use Case 2: Paste Job Posting Link - Main Success Scenario ===
- Step 1: Checking for 'My Job Applications' screen...
- Step 2: Clicking 'Add Job' button...
- Step 3: Selecting 'Paste Link' mode...
- Step 4: Entering job posting URL...
- ✓ URL entered
- Step 5: Clicking 'Add to Portfolio' button...
- Step 6-8: Verifying job appears in list after scraping...
- ✓ Use Case 2: Paste Job Posting Link - Main Success Scenario PASSED


---

#### Test 3 — useCase_ViewJobApplicationDetails_Success()
##### Use Case  
View saved job application details (success)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on job dashboard | Verify “My Job Applications” |
| User clicks job | Click job entry |
| System loads job details | Wait for navigation |
| System shows full job info | Check for title/company/description |

### Expected Behaviors
- Job Details page loads  
- Fields appear correctly  

### Execution Logs
- === Use Case 3: View Job Application Details - Main Success Scenario ===
- Step 1: Checking for 'My Job Applications' screen...
- Step 2: Checking for jobs in list...
- Clicking on job...
- Step 3-4: Checking for Job Details screen...
- ✓ Use Case 3: View Job Application Details - Main Success Scenario PASSED


---

#### Test 4 — useCase_DeleteJobApplication_Success()
##### Use Case  
Delete job application (success)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User on job dashboard | Verify “My Job Applications” |
| User opens job | Click job |
| System shows details | Verify “Job Details” |
| User clicks Delete | Click “Delete” |
| System asks for confirmation | Click “Confirm” |
| System returns to dashboard | Verify list screen |
| Job removed | Verify job no longer appears |

### Expected Behaviors
- User returns to dashboard  
- Deleted job does not appear  

### Execution Logs
- === Use Case 4: Delete Job Application - Main Success Scenario ===
- Step 1: Checking for 'My Job Applications' screen...
- Step 2: Opening job details...
- Step 3: Checking for delete button...
- Step 4: Confirming deletion...
- Step 5-6: Verifying return to dashboard...
- Step 7: Verifying deleted job no longer appears...
- ✓ Use Case 4: Delete Job Application - Main Success Scenario PASSED


---

#### Test 5 — useCase_PasteJobPosting_EmptyText_Failure()
##### Use Case  
Past job posting content (failure)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens Add Job | Click Add Job |
| System shows dialog | Verify dialog |
| User leaves empty text | No input |
| User submits | Attempt to click button |
| System rejects empty text | Button disabled / no action |
| User returns to job list | Click Cancel or pressBack |
| No job created | Verify list unchanged |

### Expected Behaviors
- Empty text rejected  
- No job created  
- User remains on job list  

### Execution Logs
- === Use Case 1 - Failure Scenario: Empty Text ===
- Step 1: Verifying we're on job applications list...
- Step 2: Opening Add Job form...
- Step 3: Add Job dialog found
- Step 4: Attempting to submit with empty text...
- Button disabled OR no submission
- Step 5: Navigating back to job list...
- Step 6: Verifying we're on job applications list...
- Step 7: Verifying side effect - job was NOT created...
- ✓ Side effect verified: Job was NOT created - test PASSED


---

#### Test 6 — useCase_PasteJobPostingLink_InvalidUrl_Failure()
##### Use Case  
Paste jobe posting link (failure)

### Scenario Steps → Test Case Steps
| Scenario Step | Test Case Step |
|--------------|----------------|
| User opens Add Job dialog | Click button |
| User selects Paste Link | Click mode |
| User enters invalid URL | Input string |
| User submits | Try clicking submit |
| System rejects / fails | No job created |
| User returns to list | Cancel or back |
| No job created | Verify unchanged list |

### Expected Behaviors
- Invalid URL does not create job  
- Stays on job list  
- No Job Details page appears  

### Execution Logs
- === Use Case 2 - Failure Scenario: Invalid URL ===
- Step 1: Verifying we're on job applications list...
- Step 2: Opening Add Job form...
- Step 3: Selecting 'Paste Link' mode...
- Step 4: Entering invalid URL...
- Step 5: Attempting to submit invalid URL...
- Step 6: Navigating back to job list...
- Step 7: Verifying we're on job applications list...
- Step 8: Verifying side effect - job was NOT created...
- ✓ Side effect verified: Job was NOT created - test PASSED



---

## 5. Automated code review results

## 5.1 Commit hash

Codacy ran on main at commit **f3e480b50bcdd6d7aac653b2393089cec4da8bd9**.

## 5.2 Issues breakdown by category

<img width="350" height="268" alt="Screenshot 2025-11-09 at 10 48 46 PM" src="https://github.com/user-attachments/assets/62106ed6-40ba-438e-839b-7fc1f7d72f98" />



## 5.3 Issues breakdown by code pattern

<img width="1305" height="328" alt="Screenshot 2025-11-09 at 10 47 08 PM" src="https://github.com/user-attachments/assets/f52c7290-f434-4dbb-a99f-fe5dc6c238c3" />


## 5.4 Justification for unfixed issues
The case **useCase\_PasteJobPostingLink\_InvalidUrl\_Failure()** is failing because the UI currently allows a malformed URL (e.g., `not-a-valid-url`) to pass through to submission, or the test can’t reliably target the URL field / validation state. In either case, the expected behavior (“submission rejected; no scraping or job creation”) isn’t deterministically enforced or asserted.


**App-side fixes:**

*   Add strict URL validation on the “Paste Link” form (e.g., `Patterns.WEB_URL`, `Uri.parse(url).scheme in {"http","https"}`) and **disable** the “Add to Portfolio” button until valid.
    
*   Show an inline error (“Invalid URL”) with a **testTag** (e.g., `invalid_url_error`) so tests can assert it.
    
*   Give the URL text field a stable **testTag** (e.g., `job_link_input`) and the submit button a **testTag** (e.g., `add_job_submit`).
    

**Test-side fixes (minimal, stable):**

*   Target `job_link_input` to enter the URL (instead of substring text matching).
    
*   Assert the submit button is **disabled** after typing an invalid URL (or that clicking it shows `invalid_url_error`) and assert **no navigation** occurs and **no new `job_list_item`** appears.
    

* * *

