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
1. User (primary actor): ...
2. **[WRITE_NAME_HERE]**: ...

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

#### Use Case 2: [WRITE_USE_CASE_2_NAME_HERE]
...

### **3.6. Screen Mock-ups**


### **3.7. Non-Functional Requirements**
<a name="nfr1"></a>

1. **[WRITE_NAME_HERE]**
    - **Description**: ...
    - **Justification**: ...
2. ...

---

## 4. Designs Specification
### **4.1. Main Components**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Interfaces**: 
        1. ...
            - **Purpose**: ...
        2. ...
2. ...


### **4.2. Databases**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
2. ...


### **4.3. External Modules**
1. **[WRITE_NAME_HERE]** 
    - **Purpose**: ...
2. ...


### **4.4. Frameworks**
1. **[WRITE_NAME_HERE]**
    - **Purpose**: ...
    - **Reason**: ...
2. ...


### **4.5. Dependencies Diagram**


### **4.6. Use Case Sequence Diagram (5 Most Major Use Cases)**
1. [**[WRITE_NAME_HERE]**](#uc1)\
[SEQUENCE_DIAGRAM_HERE]
2. ...


### **4.7. Design and Ways to Test Non-Functional Requirements**
1. [**[WRITE_NAME_HERE]**](#nfr1)
    - **Validation**: ...
2. ...


