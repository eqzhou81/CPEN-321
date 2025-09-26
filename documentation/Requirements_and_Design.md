# Requirements and Design

## 1. Change History

| **Change Date**   | **Modified Sections** | **Rationale** |
| ----------------- | --------------------- | ------------- |
| _Nothing to show_ |

---

## 2. Project Description

Struggling to find relevant interview questions is a thing of the past. Our AI-powered platform tackles this by taking your uploaded job descriptions and generating a highly tailored set of practice materials. This includes role-specific coding challenges, system design problems, and behavioral interview questions. To ensure you're interview-ready, you can input and track your progress against these personalized lists using the progress tracker, and refine your soft skills with the mock interview, which provides instant feedback to hone your behavioural question delivery.

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

![System Diagram](./images/M2_usecase.png)


### **3.3. Actors Description**
*   **User (Candidate):** The primary actor who uses the platform to manage job applications, generate tailored interview questions, practice technical and behavioral answers, and participate in discussions.
    
*   **OpenAI API:** External service responsible for generating behavioral interview questions and providing feedback on user responses in mock interviews.
    
*   **Community LeetCode API:** External service that supplies technical coding and system design questions relevant to specific job postings.
    
*   **Job Search API:** External service used to search and fetch similar job postings from the internet.
    
*   **Discussion Participants (Peers):** Other authenticated users who join and contribute to discussion groups by sharing interview experiences and insights.

### **3.4. Use Case Description**
- Use cases for feature 1: Authentication 
1. Sign Up: ...
2. Sign In: ...
3. Sign Out: ...
4. Remove Account: ...
- Use cases for feature 2: Manage job applications
1. Paste job posting : ...
2. Paste job posting link: ...
3. Click on saved job applications: ...
4. Delete job application: ...
- Use cases for feature 3: Generate questions
1. Generate questions for a saved job: ...
2. View overall progress: ...
3. Access Technical Questions: ...
4. Access Behavioural Questions: ...
- Use cases for feature 4: Solving technical questions
1. Click to solve a Technical Question: ...
2. Redirect to external website: ...
3. Mark a technical question as complete: ...
- Use cases for feature 5: Mock Interviews
1. Start mock interview: ...
2. Answer behvaioural question: ...
3. Get feedback: ...
4. End/Finish a mock interview
5. Get summary and analysis
- Use cases for feature 6: Find similar jobs 
1. Search for similar and close by jobs: ...
2. View a similar and close by job*: ...
3. Save a similar job: ...
- Use cases for feature 7: Manage discussions 
1. Browse existing discussions: ...
2. Create a discussion: ...
3. View a discussion: ...
4. Post in a discussion: ...
...

### **3.5. Formal Use Case Specifications (5 Most Major Use Cases)**
<a name="uc1"></a>

#### Use Case 1: Generate Questions for a Saved Job 

**Description**: User generates tailored interview questions (behavioral and technical) for a specific saved job application using external APIs.

**Primary actor(s)**: User

**Secondar actor(s)**: OpenAI API, Community LeetCode API, Google Authentication API

**Preconditions:** 
- User is authenticated and logged into the system
- User has at least one saved job application in their portfolio

**Post-conditions:** 
- User can access tailored behavioral and coding questions for the selected job application
- Questions are stored and available for future practice sessions
- Progress tracking is initialized for the generated questions
    
**Main success scenario**:
1. User navigates to their job applications list
2. User selects one of their saved job applications
3. User clicks on "Generate Questions" button
4. System extracts job description and requirements from the selected application
5. System calls OpenAI API to generate behavioral questions based on job description
6. System calls Community LeetCode API to gather relevant coding questions based on job title and requirements
7. System processes and stores the generated questions
8. System displays two options: "Behavioral Questions" and "Technical Questions" buttons
9. User can click either button to view the respective list of generated questions

**Failure scenario(s)**:
- 1a. Job applications list fails to load:
    - 1a1. System displays error message: "Unable to load job applications. Please check your connection and try again."

- 2a. No saved job applications available:
    - 2a1. System displays message: "No job applications found. Please add a job application first."
    - 2a2. System provides option to "Add Job Application"

- 2b. Selected job application cannot be accessed:
    - 2b1. System displays error message: "Selected job application is no longer available or corrupted."

- 3a. Generate Questions button is unresponsive:
    - 3a1. System displays error message: "Service temporarily unavailable. Please try again shortly."

- 4a. No job description content available:
    - 4a1. System displays error message: "Unable to generate questions. Job description is missing or incomplete. Please edit the job application and add job description content."

- 4b. Job description extraction fails:
    - 4b1. System displays error message: "Unable to process job description. Please try again or contact support."

- 5a. OpenAI API failure:
    - 5a1. System displays error message: "Unable to generate behavioral questions at this time."
    - 5a2. System continues to step 6 to attempt coding questions generation
    - 5a3. If coding questions are successfully generated, system displays only "Technical Questions" button
    - 5a4. If both APIs fail, no buttons are displayed and use case terminates unsuccessfully

- 5b. OpenAI API returns no behavioral questions:
    - 5b1. System displays warning: "No behavioral questions could be generated for this job type."
    - 5b2. System continues to step 6 to attempt coding questions generation
    - 5b3. If coding questions are successfully generated, system displays only "Technical Questions" button
    - 5b4. If no coding questions are generated either, no buttons are displayed and use case terminates unsuccessfully

- 6a. Community LeetCode API failure:
    - 6a1. System displays error message: "Unable to generate coding questions at this time."
    - 6a2. If behavioral questions were successfully generated, system displays only "Behavioral Questions" button
    - 6a3. If both APIs fail, no buttons are displayed and use case terminates unsuccessfully

- 6b. LeetCode API returns no coding questions:
    - 6b1. System displays warning: "No relevant coding questions found for this job type."
    - 6b2. If behavioral questions were successfully generated, system displays only "Behavioral Questions" button
    - 6b3. If no behavioral questions were generated either, no buttons are displayed and use case terminates unsuccessfully

- 7a. Question processing failure:
    - 7a1. System displays error message: "Questions generated but could not be processed. Please try again."

- 7b. Question storage failure:
    - 7b1. System displays error message: "Questions generated but could not be saved. Please try again."

- 8a. UI rendering failure:
    - 8a1. System displays error message: "Interface error occurred. Please refresh and try again."

- 9a. Button interaction failure:
    - 9a1. System displays error message: "Unable to load questions. Please try generating questions again."
    - 9a2. Use case returns to step 3

<a name="uc2"></a>

<a name="uc2"></a>

#### Use Case 2: Start Mock Interview Session  

**Description**: The user begins a mock interview session and the system loads behavioral questions.  

**Primary actor(s)**: User  

**Secondary actor(s)**: OpenAI API  

**Preconditions:**  
- User is authenticated and logged in.  
- User has generated behavioral questions for at least one job.  

**Post-conditions:**  
- Mock interview session is active.  
- First behavioral question is displayed to the user.  

**Main success scenario**:  
1. User selects a job application.  
2. User clicks on **Start Mock Interview**.  
3. System retrieves associated behavioral questions.  
4. System loads interview session UI and displays the first question.  

**Failure scenario(s)**:  
- 1a. No behavioral questions exist for this job:  
  - 1a1. System displays: *“No interview questions available. Please generate questions first.”*  
- 2a. Session initialization fails:  
  - 2a1. System shows error: *“Unable to start mock interview, please try again later.”*  
- 3a. API retrieval error:  
  - 3a1. System displays: *“Failed to fetch questions. Retry?”*  

---

<a name="uc3"></a>

#### Use Case 3: Submit Answer for Feedback  

**Description**: The user submits a typed behavioral answer, and the system analyzes it using the OpenAI API.  

**Primary actor(s)**: User  

**Secondary actor(s)**: OpenAI API  

**Preconditions:**  
- A mock interview session is active.  

**Post-conditions:**  
- Answer is stored.  
- Feedback is displayed to the user.  
- Question is marked as completed in progress tracker.  

**Main success scenario**:  
1. User types their response into the answer field.  
2. User clicks **Submit**.  
3. System sends response text to OpenAI API.  
4. API returns structured feedback.  
5. System stores answer and feedback.  
6. System displays feedback to the user.  

**Failure scenario(s)**:  
- 1a. Empty response submitted:  
  - 1a1. System shows: *“Answer cannot be empty.”*  
- 2a. API timeout or failure:  
  - 2a1. System displays: *“Unable to analyze your answer. Please try again.”*  
- 3a. Storage failure:  
  - 3a1. System shows: *“Feedback could not be saved. Retry?”*  

---

<a name="uc4"></a>

#### Use Case 4: Redirect to External Platform  

**Description**: When the user selects a technical question, the system opens the original problem page on LeetCode/HackerRank.  

**Primary actor(s)**: User  

**Secondary actor(s)**: Community LeetCode API  

**Preconditions:**  
- Technical questions have already been generated.  

**Post-conditions:**  
- The problem link is opened in a new browser tab.  

**Main success scenario**:  
1. User navigates to the list of technical questions.  
2. User clicks on a question.  
3. System retrieves the stored problem URL.  
4. System opens the URL in a new tab/window.  

**Failure scenario(s)**:  
- 1a. URL is missing or corrupted:  
  - 1a1. System displays: *“Problem link not available.”*  
- 2a. External site down:  
  - 2a1. System shows: *“The coding platform is currently unavailable.”*  
- 3a. Browser fails to open new tab:  
  - 3a1. System retries or displays: *“Unable to redirect. Open manually via link.”*  

---

<a name="uc5"></a>

#### Use Case 5: Find Similar Jobs  

**Description**: The user requests similar job postings, and the system retrieves them from the Job Search API.  

**Primary actor(s)**: User  

**Secondary actor(s)**: Job Search API  

**Preconditions:**  
- User is authenticated.  
- At least one job application exists in the user’s portfolio.  

**Post-conditions:**  
- A list of similar jobs is displayed, filtered by location and remote availability.  

**Main success scenario**:  
1. User selects a saved job application.  
2. User clicks **Find Similar Jobs**.  
3. System sends job title, skills, and location to Job Search API.  
4. API returns a list of similar jobs.  
5. System filters results (remote + nearby) and displays list to the user.  

**Failure scenario(s)**:  
- 1a. No job applications exist:  
  - 1a1. System displays: *“No saved applications. Add a job first.”*  
- 2a. API call fails:  
  - 2a1. System shows: *“Unable to fetch similar jobs. Please try again later.”*  
- 3a. No matching results:  
  - 3a1. System displays: *“No similar jobs found at this time.”*  
- 4a. Results parsing error:  
  - 4a1. System shows: *“Error processing job results.”*  

...

### **3.6. Screen Mock-ups**


### **3.7. Non-Functional Requirements**
<a name="nfr1"></a>

1. **[WRITE_NAME_HERE]**
    - **Description**: ...
    - **Justification**: ...
2. ...

---

*   ###   
    
    ### 4.1. Main Components
    
    ### 
    
    1. **Users Component**
        
        *   **Purpose:** Manage user authentication, store profile data, and track user activity across job applications and discussions.
            
        *   **Interfaces:**
            
            *   Google OAuth API (for sign in/out).
                
            *   Database collections (`users`, `sessions`).
                
    2. **Job Postings Component**
        
        *   **Purpose:** Store and manage job applications entered by users, either by copy-pasting text or pasting links. Provides searchable and filterable portfolio of jobs.
            
        *   **Interfaces:**
            
            *   Job Search API (to retrieve similar jobs).
                
            *   Database collections (`jobApplications`).
                
    3. **Question Bank Component**
        
        *   **Purpose:** Manage generated technical and behavioral questions, track completion status, and progress.
            
        *   **Interfaces:**
            
            *   Community LeetCode API (fetch coding questions).
                
            *   OpenAI API (generate behavioral questions).
                
            *   Database collections (`questions`, `answers`).
                
    4. **Mock Interview Component**
        
        *   **Purpose:** Deliver behavioral questions in a session, capture user responses, send them to OpenAI API for feedback, and compile performance summaries.
            
        *   **Interfaces:**
            
            *   OpenAI API.
                
            *   Database collections (`sessions`, `answers`).
                
    5. **Discussion Component**
        
        *   **Purpose:** Provide chat-style rooms for peer-to-peer discussions on interview preparation.
            
        *   **Interfaces:**
            
            *   Database collections (`discussions`, `messages`).
                
    6. **Web Scraper Component**
        
        *   **Purpose:** Extract job information from links provided by the user when uploading a posting.
            
        *   **Interfaces:**
            
            *   Job posting websites.
                
            *   Database (`jobApplications`).
                
    
    * * *
    
    ### 4.2. Databases
    
    ### 
    
    *   **MongoDB** (NoSQL database)
        
    
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
            
    4. **Job Search API**
        
        *   **Purpose:** Fetch similar job postings from external job boards.
            
    
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


### **4.6. Use Case Sequence Diagram (5 Most Major Use Cases)**
1. [**[WRITE_NAME_HERE]**](#uc1)\
[SEQUENCE_DIAGRAM_HERE]
2. ...


### **4.7. Design and Ways to Test Non-Functional Requirements**
1. [**[WRITE_NAME_HERE]**](#nfr1)
    - **Validation**: ...
2. ...






