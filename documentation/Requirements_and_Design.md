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

## 3. Requirements Specification

### **3.1. List of Features**

#### 1. Authentication
To access app features, a user must **Sign In** using Google Authentication Service first. New users should **Sign Up** before signing in. An authenticated user can **Sign Out**. Users can also remove their account.

#### 2. Manage Job Applications
This feature allows users to build a personalized database of job opportunities they're interested in. Users can upload job description documents directly to the app or paste links to job postings from various career websites. The system stores and organizes these job applications, making them easily accessible for reference during interview preparation. This creates a centralized hub where users can track all their potential opportunities and use them as input for generating relevant interview questions.

#### 3. Generate Questions
For each job application, the user can request relevant coding and behavioral questions. Upon request, the app generates a curated set of interview questions by leveraging a Selenium web scraper and a community LeetCode API to gather coding and system-level questions tailored to the job description. The app then displays two options: **Coding Questions** and **Behavioral Questions**.

If the user selects **Coding Questions**, the app displays a list of relevant coding and system-level questions. When the user taps on a question, they are redirected to the appropriate external platform (e.g., LeetCode, HackerRank) where they can practice and solve the problem in a real coding environment.

If the user selects **Behavioral Questions**, the app displays a list of relevant behavioral questions along with a "Start Mock Interview" button. When the user taps the button, the app initiates a mock interview session where they can answer the behavioral questions and receive detailed feedback on their responses.

#### 4. Mock Interviews
A user can start a mock interview session for behavioral questions. When the user taps the "Start Mock Interview" button, the app redirects them to a dedicated mock interview screen where the behavioral questions are displayed one at a time.

The user can type or record their answer to each behavioral question. After submitting an answer, the app analyzes the response and provides detailed feedback, highlighting strengths and areas for improvement based on common interview best practices.

The user can proceed through all the behavioral questions in the mock interview session. Once the session is complete, the app displays a summary of the user's performance, including feedback for each question and an overall assessment of their responses.

#### 5. Progress Tracker
A user can track their progress on the generated questions for each job application. When viewing the list of coding or behavioral questions, the user can mark individual questions as complete after practicing or solving them.

The app automatically tracks the user's progress, displaying the number of completed questions out of the total generated questions. The user can view their overall progress as a percentage or completion count (e.g., "5/10 questions completed").

If the user marks a question as complete while viewing the progress tracker, the completion status and progress percentage are automatically updated in real-time, allowing the user to monitor their preparation progress for each job application.

#### 6. Find Similar Jobs
For each job application, the user can search for similar job postings. Upon request, the app uses a Selenium web scraper to search for job positions with the same or similar titles currently available on the market. The app then calculates the distance between each job location and the user's location to filter for nearby opportunities, as well as identifies remote positions.

The app displays a curated list of similar job postings, showing both local opportunities within the user's vicinity and remote positions. When the user taps on a job posting, the app displays the full job details, including the company name, job description, location, and a link to apply. The user can then choose to save the job posting to their job applications or apply directly through the external link.

#### 7. Manage Discussions
A user can create a group discussion and become its owner. When creating a discussion, the discussion owner provides the group topic (e.g., "Amazon SDE Interview" or "Google Behavioral Tips").

After creating the discussion, the owner can view group details such as the discussion topic, the number of participants, and their role in the discussion ("owner"). The owner can also delete groups they own.

Any user can browse a list of active discussions and join discussions relevant to their job search. When joining a discussion, the user can view the discussion topic, participant list, and previous messages.

Users can then post messages to share their interview experiences, ask questions, and engage with others who have applied to similar positions or companies. If a new user joins the discussion or posts a message while it is being viewed by another user, the participant list is automatically updated in real-time, ensuring all members stay synchronized with the latest activity.



### **3.2. Use Case Diagram**


### **3.3. Actors Description**
1. **[WRITE_NAME_HERE]**: ...
2. **[WRITE_NAME_HERE]**: ...

### **3.4. Use Case Description**
- Use cases for feature 1: [WRITE_FEATURE_1_NAME_HERE]
1. **[WRITE_NAME_HERE]**: ...
2. **[WRITE_NAME_HERE]**: ...
- Use cases for feature 2: [WRITE_FEATURE_2_NAME_HERE]
3. **[WRITE_NAME_HERE]**: ...
4. **[WRITE_NAME_HERE]**: ...
...

### **3.5. Formal Use Case Specifications (5 Most Major Use Cases)**
<a name="uc1"></a>

#### Use Case 1: [WRITE_USE_CASE_1_NAME_HERE]

**Description**: ...

**Primary actor(s)**: ... 
    
**Main success scenario**:
1. ...
2. ...

**Failure scenario(s)**:
- 1a. ...
    - 1a1. ...
    - 1a2. ...

- 1b. ...
    - 1b1. ...
    - 1b2. ...
                
- 2a. ...
    - 2a1. ...
    - 2a2. ...

...

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


