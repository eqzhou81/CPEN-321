# Requirements and Design

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Project Description

Struggling to find relevant interview questions is a thing of the past. Our AI-powered platform tackles this by taking your uploaded job posting and generating a highly tailored set of practice materials. This includes role-specific coding challenges, system design problems, and behavioral interview questions. To ensure you're interview-ready, you can input and track your progress against these personalized lists, and refine your soft skills with the mock interview, which provides instant feedback to hone your behavioural question delivery.

This comprehensive tool extends beyond just preparation by helping users discover new opportunities and build community. Based on the initial job information provided, the platform intelligently suggests comparable roles, broadening the user's career search and expanding their practice scope. Furthermore, users can engage in peer-to-peer learning by creating or joining discussion groups, allowing them to share recent interview experiences, discuss preparation strategies, and exchange insights with others pursuing similar roles. This integrated approach ensures a personalized, efficient, and collaborative journey toward securing their desired position.


---

## 3. Requirements Specification

### **3.1. List of Features**

#### 1. Authentication
To access app features, a user must Sign In using Google Authentication Service first. New users should Sign Up before Signing In. An authenticated user can Sign Out. Users can also delete their account from the app’s database.

#### 2. Manage job applications
This feature allows users to build a personalized portfolio of job opportunities they're interested in. Users have two options for adding job postings: they can either paste the job posting content directly (copying and pasting the job description text into a text field) or paste a link to the job posting from career websites.

The system stores and organizes these job applications as a searchable, clickable list where each entry displays the job title and company name. Users can view all their saved job applications in this centralized list and must click on a specific job application to use it for generating interview questions. 

#### 3. Generate questions
For each job application, the user can request relevant coding and behavioral questions. Upon request, the app gathers a curated set of interview questions by leveraging a community LeetCode API to gather coding and system design questions tailored to the job description and OpenAI for behavioral questions. The app then displays two options: Technical Questions and Behavioral Questions, which the user can choose from.

Additionally, the app automatically tracks and displays the user's completion progress across all generated questions, allowing them to monitor their overall preparation status for that specific job application.

#### 4. Solving technical questions
If the user selects Technical Questions, the app displays a list of relevant coding and system design questions. When the user taps on a question, they are redirected to the appropriate external platform (e.g., LeetCode, HackerRank) where they can practice and solve the problem in a real coding environment. After solving the questions, the user can mark the question as completed which increments their overall progress tracker.

#### 5. Mock Interviews
If the user selects Behavioural Questions, the app displays a list of behavioural questions. A user can start a mock interview session for behavioral questions. When the user taps the "Start Mock Interview" button, the app redirects them to a dedicated mock interview screen where the behavioral questions are displayed.

The user can type their answer to each behavioral question. After submitting an answer, the app uses the OpenAI API to analyze the response and provide detailed feedback, then it automatically marks the question as complete.

The user can then end the mock interview or proceed through all the behavioral questions in the mock interview session. Once the session is complete, the app uses the OpenAI API to generate a summary of the user's performance, including feedback for each question and an overall assessment of their responses.

#### 6. Find similar jobs
For each job application, the user can search for similar job postings. Upon request, the app searches for job positions with the same or similar titles currently available on the market. The app then calculates the distance between each job location and the user's location to filter for nearby opportunities, as well as identifies remote positions.

The app displays a curated list of similar job postings. When the user taps on a job posting, the app displays the full job details, including the company name, job description, location, and a link to apply. The user can then choose to save the job posting to their job applications.

#### 7. Manage discussions
A user can create a discussion and provide the discussion topic (e.g., "Amazon SDE Interview" or "Google Behavioral Tips").

Any user can browse a list of active discussions and find discussions relevant to their job search. They will be able to view all discussion chats. Users can post messages to share their interview experiences, ask questions, and engage with others who have applied to similar positions or companies.


### **3.2. Use Case Diagram**

![System Diagram](./images/usecase_M3.drawio.png)


### **3.3. Actors Description**
*   **User (Candidate):** The primary actor who uses the platform to manage job applications, generate tailored interview questions, practice technical and behavioral answers, and participate in discussions.
    
*   **OpenAI API (non-active actor):** External service responsible for generating behavioral interview questions and providing feedback on user responses in mock interviews.
    
*   **Community LeetCode API (non-active actor):** External service that supplies technical coding and system design questions relevant to specific job postings.
    
*   **Job Search API (non-active actor):** External service used to search and fetch similar job postings from the internet.


### **3.4. Use Case Description**
**Feature 1: Authentication**

*   **Sign Up:** A new user authenticates via Google OAuth; the system creates a linked account record.
    
*   **Sign In:** The user signs in with Google OAuth and gains access to protected features.
    
*   **Sign Out:** The user ends the current authenticated session.
    
*   **Remove Account:** The user requests deletion; the system permanently removes their data.
    

**Feature 2: Manage Job Applications**

*   **Paste job posting:** The user pastes job posting text; the system stores title, company, and description.
    
*   **Paste job posting link:** The user saves a URL; the system fetches and normalizes the job posting.
    
*   **View saved job application details:** The user opens a stored job application in their job portfolio.
    
*   **Delete job application:** The user removes an existing job from their portfolio.
    

**Feature 3: Generate Questions**

*   **Generate questions for a saved job:** The system produces behavioral (OpenAI) and technical (LeetCode) sets for the selected job. The system shows the user's overall completion progress across the generated questions.
    
*   **Access Technical Questions:** The user opens the technical set for that job.
    
*   **Access Behavioral Questions:** The user opens the behavioral set for that job.
    

**Feature 4: Solving Technical Questions**

*   **Solve a Technical Question:** The user selects a problem to practice then the system redireted the user to the external website that hosts the question (LeetCode).
    
*   **Mark a technical question as complete:** The user marks a question as completed; overall user progress for the job application updates.
    

**Feature 5: Mock Interviews**

*   **Start mock interview:** The user starts a behavioral mock interview session for the selected job.
    
*   **Answer behavioral questions:** The user types an answer into the response box and submits. The system analyzes the answer via OpenAI and returns feedback then marks the question as complete.
    
*   **End/Finish a mock interview:** The user can end the session without completing the set of questios or finish the session my completing the entire set of questions. The system then gives the user feedback and a summary analysis using the OpenAI API.
    

**Feature 6: Find Similar Jobs**

*   **Search for similar and close-by jobs:** The systme generates a list of similar jobs in terms of duties and positions and proximity to the job application chosen by the user. It will also include similar postions that are completly remote.
    
*   **View a similar and close-by job:** The user opens a posting to view the found job posting details.
    
*   **Save a similar and close-by job:** The user adds the viewed similar job posting to their portfolio.
    

**Feature 7: Manage Discussions**

*   **Browse existing discussions:** User can view and search through available discussion topics related to job interviews and career preparation.
    
*   **Create a discussion:** User can start a new discussion topic (e.g., "Amazon SDE Interview Tips") to connect with others preparing for similar interviews.
    
*   **View a discussion:** User can open and read all messages within a specific discussion thread to learn from others' experiences.
    
*   **Post in a discussion:** User can share their own interview experiences, ask questions, or provide advice by posting messages in relevant discussions.

  
### **3.5. Formal Use Case Specifications (5 Most Major Use Cases)**

<a name="uc1"></a>

#### Use Case 1: Generate Questions for a Saved Job 

**Description**: User selects a saved job application and requests tailored interview questions (behavioral and technical) for the selected job application.

**Primary actor(s)**: User, OpenAI API, Community LeetCode API

**Preconditions:** 
- User is authenticated and logged into the system
- User has at least one saved job application in their portfolio

**Post-conditions:** 
- User can access tailored behavioral and coding questions for the selected job application
- Questions are stored and available for future practice sessions
- Progress tracking is initialized for the generated questions
    
**Main success scenario**:
1. User navigates to their job applications list
2. User selects a saved job application
3. User clicks on "Generate Questions" button
4. System obtains saved job description details
5. System calls OpenAI API to generate behavioral questions based on job description
6. System calls Community LeetCode API to gather relevant coding questions based on job details
7. System processes and stores the generated questions
8. System displays two options: "Behavioral Questions" and "Technical Questions" buttons
9. User can click either button to view the respective list of generated questions

**Failure scenario(s)**:

- 4a. No job description content available:
    - 4a1. System displays error message: "Unable to generate questions. Job description is missing or incomplete. Please edit the job application and add job description content."

- 5a. OpenAI API failure:
    - 5a1. System displays error message: "Unable to generate behavioral questions at this time."
    - 5a2. System continues to step 6 to attempt coding questions generation.
    - 5a3. No "Behavioural Questions" button will be available in step 8.

- 5b. OpenAI API returns no behavioral questions:
    - 5b1. System displays warning: "No behavioral questions could be generated for this job type."
    - 5b2. System continues to step 6 to attempt coding questions generation.
    - 5b3. No "Behavioural Questions" button will be available in step 8.

- 6a. Community LeetCode API failure:
    - 6a1. System displays error message: "Unable to generate coding questions at this time."
    - 6a2. No "Technical Questions" button will be available in step 8.

- 6b. LeetCode API returns no coding questions:
    - 6b1. System displays warning: "No relevant coding questions found for this job type."
    - 6b2. No "Technical Questions" button will be available in step 8.
    
- 7a. Question processing failure:
    - 7a1. System displays error message: "Questions generated but could not be processed. Please try again."




<a name="uc2"></a>

#### Use Case 2: Solve Technical Questions  

**Description**: User accesses and solves technical coding questions by being redirected to external coding platforms, then marks questions as complete to track progress.

**Primary actor(s)**: User  

**Secondary actor(s)**: External Coding Platforms (LeetCode, HackerRank)  

**Preconditions:**  
- User has generated technical questions for a job application
- Technical questions list is displayed to the user

**Post-conditions:**  
- User is redirected to external coding platform to solve the problem

**Main success scenario**:  
1. User navigates to the list of technical questions for a selected job application
2. User clicks on a specific technical question
3. System retrieves the stored problem URL for the selected question
4. System opens the external coding platform URL in a new browser tab/window
5. User solves the problem on the external platform

**Failure scenario(s)**:  
- 1a. Technical questions list fails to load:
    - 1a1. System displays error message: "Unable to load technical questions. Please try again."

- 2a. Question selection fails:
    - 2a1. System displays error message: "Unable to select question. Please refresh and try again."

- 3a. Problem URL is missing or corrupted:
    - 3a1. System displays error message: "Problem link not available for this question."
    - 3a2. User returns to questions list

- 4a. External coding platform is unavailable:
    - 4a1. System displays error message: "The coding platform is currently unavailable. Please try again later."

- 4b. Browser fails to open new tab:
    - 4b1. System displays error message: "Unable to redirect. Please copy the link and open manually."
    - 4b2. System provides clickable link as fallback

---

<a name="uc3"></a>

#### Use Case 3: Start Mock Interview Session  

**Description**: User initiates a mock interview session for behavioral questions, progressing through questions with AI-powered feedback and performance tracking.

**Primary actor(s)**: User  

**Secondary actor(s)**: OpenAI API  

**Preconditions:**  
- User is authenticated and logged in
- User has generated behavioral questions for a selected job application
- Behavioral questions are available and stored in the system

**Post-conditions:**  
- Mock interview session is active with the first question displayed
- User can proceed through questions and receive feedback
- Session progress is tracked for completion monitoring

**Main success scenario**:  
1. User navigates to behavioral questions for a selected job application
2. User clicks on "Start Mock Interview" button
3. System retrieves the stored behavioral questions for the selected job
4. System initializes mock interview session interface
5. System displays the first behavioral question to the user
6. User can begin answering questions and receiving feedback

**Failure scenario(s)**:  
- 1a. Behavioral questions list fails to load:
    - 1a1. System displays error message: "Unable to load behavioral questions. Please try again."

- 2a. Start Mock Interview button is unresponsive:
    - 2a1. System displays error message: "Service temporarily unavailable. Please try again."

- 3a. No behavioral questions exist for selected job:
    - 3a1. System displays message: "No behavioral questions available for this job. Please generate questions first."
    - 3a2. System provides option to return to question generation

- 3b. Question retrieval from storage fails:
    - 3b1. System displays error message: "Unable to retrieve questions. Please try generating questions again."

- 4a. Mock interview session initialization fails:
    - 4a1. System displays error message: "Unable to start mock interview session. Please try again later."

- 4b. Session interface fails to load:
    - 4b1. System displays error message: "Interview interface could not load. Please refresh and try again."

- 5a. Question display fails:
    - 5a1. System displays error message: "Unable to display question. Please restart the mock interview."

- 5b. OpenAI API connection fails during session setup:
    - 5b1. System displays error message: "Interview feedback service unavailable. Please try again later."

---

<a name="uc4"></a>

#### Use Case 4: Find Similar and Close-by jobs 

**Description:** User selects a saved job describtion and requests similar job postings that have similar titles and duties to their saved job, the simialr jobs are filtered by proximity to the original job location and include remote opportunities.

**Primary Actors:** User  

**Preconditions:** 
- User is authenticated and logged into the system
- User has at least one saved job application

**Post-conditions:** 
- User receives a curated list of similar job postings
- User can view job details and save interesting positions to their saved job applications

**Main Success Scenario:**
1. User navigates to their job applications list
2. User selects a saved job application, which has a "Fine Similar Jobs" button on the bottom of the screen
3. User clicks on "Find Similar Jobs" button
4. System retrieves saved job title, key requirements, and location from the selected application
5. System searches external job sites for similar positions
6. System calculates distance between each found job location and the original job's location
7. System filters results for opportunities near the original job location or remote positions
8. System displays a curated list of similar job postings with location information relative to original job
9. User taps on a job posting to view full details
10. User can choose to save the job posting to their saved job applications

**Failure scenario(s)**:
- 4b. Original job location is unavailable:
    - 4b1. System displays warning: "Original job location not found. Showing all similar positions without location filtering."
    - 4b2. System continues without location-based filtering

- 5a. No similar jobs found:
    - 5a1. System displays error message: "No similar jobs found. Check back later"
    - 5a2. The use case terminates unsuccessfully and the system just shows the current saved job description screen.

- 6a. Distance calculation fails:
    - 6a1. System displays warning: "Unable to calculate distances from original job location. Showing all results."

- 8a. No similar jobs found after location filtration:
    - 8a1. System displays message: "No similar job postings found near the original job location. Check back later."
    - 8a2. The use case terminates unsuccessfully and the system just shows the current saved job description screen.

- 10a. Duplicate job posting detected:
    - 10a1. System displays warning: "This job posting is already in your applications."
    - 10a2. User can continue browsing other results

----
<a name="uc5"></a>

#### Use Case 5: Create Discussion  

**Description**: User creates a new discussion and enters the topic of the discussion. This created discussion is then available for all users to browse, view and post in.

**Primary actor(s)**: User  

**Preconditions:**  
- User is authenticated and logged into the system

**Post-conditions:**  
- New discussion topic is created and stored in the system
- Discussion is available for other users to browse and join
- User can post messages in the newly created discussion

**Main success scenario**:  
1. User navigates to the discussions section
2. User clicks on "Create Discussion" button
3. System displays discussion creation form
4. User enters discussion topic title (e.g., "Amazon SDE Interview Tips")
5. User optionally adds an initial description or message
6. User clicks "Create Discussion" to submit
7. System stores the discussion
8. System redirects user to the newly created discussion page
9. User can begin posting messages in the discussion

**Failure scenario(s)**:  
- 1a. Discussions section fails to load:
    - 1a1. System displays error message: "Unable to load discussions. Please check your connection and try again."

- 2a. Create Discussion button is unresponsive:
    - 2a1. System displays error message: "Service temporarily unavailable. Please try again."

- 3a. Discussion creation form fails to display:
    - 3a1. System displays error message: "Unable to load discussion form. Please refresh and try again."

- 4a. User submits empty discussion topic:
    - 4a1. System displays validation error: "Discussion topic is required. Please enter a topic title."
    - 4a2. User remains on creation form to provide input

- 4b. Discussion topic exceeds character limit:
    - 4b1. System displays validation error: "Topic title is too long. Please keep it under 100 characters."
    - 4b2. User can edit the topic title

- 5a. Initial description exceeds character limit:
    - 5a1. System displays validation error: "Description is too long. Please keep it under 500 characters."
    - 5a2. User can edit the description

- 6a. Create Discussion submission fails:
    - 6a1. System displays error message: "Unable to submit discussion. Please try again."

- 7a. System storage fails:
    - 9a1. System displays error message: "Unable to save discussion. Please try again."
    - 9a2. User can retry creation

- 8a. Redirection to discussion page fails:
    - 10a1. System displays message: "Discussion created successfully but unable to redirect. Please check your discussions list."
    - 10a2. System provides manual link to the new discussion

- 9a. Initial message posting interface fails to load:
    - 11a1. System displays warning: "Discussion created but messaging interface unavailable. Please refresh to start posting."

---

<!-- ### **3.6. Screen Mock-ups**

<img width="975" height="789" alt="Screenshot 2025-09-26 at 10 46 29 PM" src="https://github.com/user-attachments/assets/87c59d73-f14f-481e-a9d7-e2141818c2d4" />
<img width="746" height="484" alt="Screenshot 2025-09-26 at 10 46 52 PM" src="https://github.com/user-attachments/assets/6fb789cd-5a74-4c98-abfe-054f054adbca" />
<img width="1024" height="780" alt="Screenshot 2025-09-26 at 10 47 12 PM" src="https://github.com/user-attachments/assets/60b9ec54-250a-4b50-b393-f7577b1c8ec5" />
<img width="976" height="717" alt="Screenshot 2025-09-26 at 10 47 28 PM" src="https://github.com/user-attachments/assets/ba21b031-9a9f-4316-9824-e927ee1f4ff1" /> -->




### **3.7. Non-Functional Requirements**


**NFR-1 Performance**

*   **Requirement:** Generate a 20-question set (behavioral + technical) in **≤ 10 s p95**.
    
*   **Why it matters:** Fast iteration is critical during prep; slow generation breaks flow.
    

**NFR-2 Security & Privacy**

*   **Requirement:** TLS 1.2+ in transit; AES-256 at rest for résumés/JDs/answers; per-user data isolation; hard delete on account removal.
    
*   **Why it matters:** Users share sensitive information; trust hinges on strong data protection.
    

**NFR-3 Availability**

*   **Requirement:** **≥ 99.5% uptime** monthly (excl. planned maintenance); graceful degradation if external APIs are down.
    
*   **Why it matters:** Users prep near interview dates; downtime must be rare and non-blocking.

---

*   ###   
    
   ### 4.1. Main Components
   ###

**Job Applications**
- **Purpose:** Handle job application management - adding, storing, viewing, and organizing user's saved job postings
- **Rationale:** Centralizes all job-related data operations and provides foundation for question generation

**Users** 
- **Purpose:** Manage user authentication, profiles, and user-specific data access
- **Rationale:** Handles all user-related operations and maintains user session state

**Question Bank**
- **Purpose:** Generate, store, and retrieve technical and behavioral interview questions for specific job applications
- **Rationale:** Encapsulates question generation logic and manages question lifecycle

**Mock Interview**
- **Purpose:** Conduct mock interview sessions, collect user responses, and provide AI-generated feedback
- **Rationale:** Manages interview flow and integrates with OpenAI for response analysis

**Discussion**
- **Purpose:** Handle discussion room creation, management, and user participation
- **Rationale:** Manages community features separate from individual practice components
                
    
    * * *
    
    ### 4.2. Databases
    
    ### 
    
    *   **MongoDB** (NoSQL database) in a larger scale project we would have used multiple databases for separation of concerns; however, to reduce overhead we will only be using one with multiple collections.

        
    
    Collections:
    
    1. **users**
        
        *   **Purpose:** Store user authentication info, profile data, and ownership of content.
            
    2. **jobApplications**
        
        *   **Purpose:** Contain uploaded job postings, including title, company, description, tags.
            
    3. **questions**
        
        *   **Purpose:** Store technical/system design/behavioral questions, with status (pending, completed).
            
    4. **sessions**
        
        *   **Purpose:** Track active mock interview sessions and their state.
            
    5. **answers**
        
        *   **Purpose:** Store user-submitted answers and AI-generated feedback.
            
    6. **discussions**
        
        *   **Purpose:** Contain discussion room metadata.
            
    7. **messages**
        
        *   **Purpose:** Store chat content (user messages inside discussions).
            
    
    * * *
    
    ### 4.3. External Modules
    
    ### 
    
    1. **Community LeetCode API**
        
        *   **Purpose:** Retrieve coding and system design questions relevant to job postings.
            
    2. **Google OAuth API**
        
        *   **Purpose:** Manage user authentication and sign-in with Google accounts.
            
    3. **OpenAI API**
        
        *   **Purpose:** Generate behavioral interview questions from job descriptions and provide feedback on user answers.
            
            
    
    * * *
    
    ### 4.4. Frameworks
    
    ### 
    
    1. **Express.js**
        
        *   **Purpose:** Backend framework for API routing and business logic.
            
        *   **Reason:** Lightweight, scalable, and familiar to the development team.
            
    2. **Azure VM**
        
        *   **Purpose:** Host backend services and database in the cloud.
            
        *   **Reason:** Strong support for scalability and the team’s prior experience.


### **4.5. Dependencies Diagram**


![System Diagram](./images/M2_dependecy.png)



<!-- ### **4.6. Use Case Sequence Diagram (5 Most Major Use Cases)**
<img width="1418" height="540" alt="Screenshot 2025-09-26 at 3 44 19 PM" src="https://github.com/user-attachments/assets/ec283ee1-790b-4bc0-8d99-c9c7fec30dea" />

<img width="823" height="430" alt="Screenshot 2025-09-26 at 3 45 37 PM" src="https://github.com/user-attachments/assets/d65f562b-1972-4fbe-896d-4f240880c25a" />

<img width="796" height="394" alt="Screenshot 2025-09-26 at 3 46 34 PM" src="https://github.com/user-attachments/assets/fa00cc4e-490a-4b1e-9c4d-49c861dc0687" />

<img width="935" height="386" alt="Screenshot 2025-09-26 at 3 47 28 PM" src="https://github.com/user-attachments/assets/621f8d6a-5c27-4d50-9d3e-447412d9c345" />

<img width="902" height="391" alt="Screenshot 2025-09-26 at 3 48 19 PM" src="https://github.com/user-attachments/assets/fe91ab5e-c566-4b11-8018-7a2021a66d62" /> -->







<!-- ### **4.7. Design and Ways to Test Non-Functional Requirements**
*     
    
    **Performance & Responsiveness**  
    **Validation:**
    
    *   Load-test **UC1 (Generate Questions)** with 100 virtual users (k6/JMeter): ramp 2 min → steady 5 min. Pass if **p95 ≤ 10s** end-to-end and error rate < 1%.
        
    *   API latency tests for lightweight endpoints (e.g., `GET /jobs`, `GET /questions`) with 100 VUs. Pass if **p95 ≤ 500ms**.
        
    *   Client render timing via Lighthouse (mobile emulation). Pass if **First Contentful Paint ≤ 2s p95** on mid-range hardware.
        
    
    * * *
    
    **Security & Privacy**  
    **Validation:**
    
    *   Transport security: SSL Labs scan must grade **A**; HSTS present; only HTTPS reachable.
        
    *   App vulns: run **OWASP ZAP** authenticated scan; Pass if **0 High/Critical** (Mediums triaged).
        
    *   Secrets & deps: **Gitleaks/TruffleHog** + `npm audit` CI step; Pass if **no exposed secrets** and **no critical** vulns.
        
    *   AuthZ tests: attempt cross-user access to `/jobs/{id}` and `/answers/{id}`; Pass if **403/404** for non-owners.
        
    *   Data deletion: create user → add data → “Delete Account” → verify **hard delete within 24h** (Mongo queries).
        
    
    * * *
    
    **Availability & Resilience**  
    **Validation:**
    
    *   Uptime SLO via Azure Monitor/App Insights: Pass if **≥ 99.5% monthly** (excl. planned maintenance).
        
    *   Chaos drills: kill API process; simulate OpenAI/LeetCode outages (DNS blackhole). Pass if app **degrades gracefully** (cached content, clear messaging) and **auto-recovers < 1 min**.
        
    *   Backup/restore: snapshot Mongo in non-prod and restore. Pass if **RTO ≤ 60 min** and integrity checks succeed. -->














