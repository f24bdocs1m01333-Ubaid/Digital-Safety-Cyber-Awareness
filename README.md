# Digital Safety & Cyber Awareness Portal
### Capstone Project | Web Technologies SP26 (Sections 2M)
**Student Name:** M.Ubaid ur Rehman 
**Roll Number:** F24BDOCS1M01333  

---

## Project Overview

**CyberSafe** is a community-driven web application designed to track, report, and analyze active cyber security threats, scams, and phishing attempts. The application is divided into a public-facing **Threat Center (User Panel)** for reporting and viewing alerts, and an **Admin Operations (Admin Panel)** panel where moderators can manage the database records (CRUD operations) and analyze real-time threat metrics.

This project is built using semantic **HTML5**, custom responsive **CSS3** (no frameworks), and plain **Vanilla JavaScript (ES6)** using `async/await` with `fetch` to integrate with a mock REST API database backend driven by **JSON Server**.

---

## Key Features

### 1. User Panel (`index.html` & `app.js`)
* **Real-time Threats Feed:** Fetches and displays active threat bulletins via `GET` requests to the JSON Server.
* **Debounced Search Input (Bonus Feature):** Allows searching threats by title or description in real-time, utilizing a custom-built javascript debounce function (300ms delay) to prevent redundant server calls.
* **Category Filtering:** Dynamically filters the list by threats type (Phishing, Malware, Ransomware, Social Engineering, Identity Theft).
* **Cyber Threat Submission Form:** A 7-field reporting form allowing users to submit new alert notices using `POST`:
  1. *Threat Title* (string, min 5 chars)
  2. *Category* (dropdown select option)
  3. *Severity Level* (dropdown select option)
  4. *Date Spotted* (date picker, validated to block future entries)
  5. *Description* (textarea description, min 20 chars)
  6. *Reporter Name* (string, min 2 chars)
  7. *Reporter Email* (validated email pattern format)
* **Interactive Inline Validation:** Evaluates form fields in real-time on `blur` and `input` events, displaying visual validation feedback indicators below elements instead of browser alert boxes.
* **Automatic Re-renders:** Repopulates the feed container instantly after successful POST submissions.
* **Responsive Visual Feedback:** Shows custom scanning/pulsing skeleton mock loading overlays and warning panels if the local REST server is offline or returns error states.

### 2. Admin Panel (`admin.html` & `admin.js`)
* **Distinct Visual Contrast:** Re-themed using CSS variable modifiers into a crimson alert operations color palette with distinct "Admin Center" badges.
* **Metrics Dashboard:** Displays 3 critical summary statistics calculated dynamically from the database entries:
  1. *Total Registered Alerts* (count)
  2. *High/Critical Severity Ratio* (percentage of severe threats relative to all entries)
  3. *Primary Vector* (the most common threat category)
* **Admin Threat Directory:** Table grid listing all registered threat records with detail cards.
* **Edit Record Modal Dialog:** Pre-loads records into a custom overlay dialog using `PUT` updates. Features complete field validation and adds an admin-only dropdown to adjust status labels ("Under Review", "Verified Alert", "Resolved").
* **Delete Record Flow:** Removes items from the backend server via `DELETE`. Incorporates a custom HTML `<dialog>` confirmation screen to prevent accidental deletions.

---

## File Architecture

```
📁 Digital Safety & Cyber Awareness/
│
├── 📄 index.html      # Public user-facing dashboard & report form
├── 📄 admin.html      # Admin dashboard panel, stats, and modals
├── 📄 style.css       # Unified design styles, responsive grids, themes
├── 📄 app.js          # JavaScript controller for the User Panel
├── 📄 admin.js        # JavaScript controller for the Admin Panel
├── 📄 db.json         # Mock database stores JSON data records
└── 📄 README.md       # Project overview, feature list & instructions
```

---

## Installation & Setup Guide

To run this application locally, you will need **Node.js** and **NPM** installed.

### Step 1: Clone or Extract the Project
Extract the zip folder contents into your local workspace directory.

### Step 2: Start the JSON Server
Launch the REST backend database server. Open a terminal in the root folder of the project and execute:

```bash
npx json-server --watch db.json --port 3000
```

*By default, JSON Server will start running at `http://localhost:3000`. Keep this terminal window open.*

### Step 3: Open the Web Application
Open `index.html` in your browser. You can use standard browser opening methods or launch via a local server extension (like Live Server in VS Code).

---

## Concept Questions & Answers for Viva

1. **What does `e.preventDefault()` do, and why do we call it inside a form submit handler?**
   It cancels the browser's default behavior, which is to refresh the page and submit form data via query params. Calling it allows custom JavaScript validation to run first and handle submission asynchronously using `fetch`.

2. **Why does `setTimeout(cb, 0)` not run immediately?**
   Because of the Javascript Event Loop. The callback function `cb` is pushed to the Web APIs/Callback Queue and can only run after the Execution Stack is completely clear of synchronous scripts.

3. **What is the difference between PUT and PATCH methods?**
   `PUT` replaces the entire target resource with the uploaded payload. `PATCH` applies partial modifications to a resource.

4. **What does `JSON.stringify()` return, and why do we need it?**
   It converts a JavaScript object into a JSON formatted string. This is necessary because server HTTP payloads require plain text formats, and cannot directly transmit in-memory JS objects.

5. **If your fetch returns a 404, will it throw an error?**
   No, `fetch` only rejects a promise on network failures (server down, DNS error). A 404 response is returned as a resolved promise with `response.ok` set to `false`. We check `if (!response.ok) throw new Error()` to handle these cases.
