"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  GraduationCap, Users, LayoutDashboard, CalendarDays, BookOpen,
  ClipboardCheck, FileText, Trophy, CreditCard, MapPin, ShieldAlert,
  FlaskConical, Bell, LogOut, Menu, X, Plus, Upload, CheckCircle2,
  ChartNoAxesCombined, ClipboardList, Presentation, ChevronRight,
  Home, Settings, Download
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Role = "Student" | "Faculty";
type Section = string;

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
};

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  file_path: string;
  status: string;
  submitted_at: string | null;
  marks: number | null;
  faculty_feedback: string | null;
};

const studentItems = [
  ["Overview", LayoutDashboard], ["Attendance", ClipboardCheck],
  ["Courses", BookOpen], ["Exams", CalendarDays], ["Results", Trophy],
  ["Quizzes", ClipboardList], ["Quiz Results", ChartNoAxesCombined],
  ["Timetable", CalendarDays], ["Fee Payment", CreditCard],
  ["Assignments", FileText], ["Campus Events", Bell],
  ["Campus Map", MapPin], ["Emergency & Safety", ShieldAlert]
] as const;

const facultyItems = [
  ["Overview", LayoutDashboard], ["Attendance Manager", ClipboardCheck],
  ["Courses & Materials", BookOpen], ["Marks & Grades", Trophy],
  ["Digital Whiteboard", Presentation], ["Academic Planner", CalendarDays],
  ["Quiz Builder", ClipboardList], ["Quiz Analyser", ChartNoAxesCombined],
  ["Timetable", CalendarDays], ["Assignment Review", FileText],
  ["Event Manager", Bell], ["Campus Map", MapPin],
  ["Emergency & Safety", ShieldAlert], ["Lab Equipment", FlaskConical]
] as const;

const subjects = [
  "Discrete Structures of Computing",
  "Operating System",
  "Object-Oriented Programming",
  "Computer Organization and Architecture"
];

const initialAttendance = [
  { subject: subjects[0], attended: 27, total: 30 },
  { subject: subjects[1], attended: 24, total: 30 },
  { subject: subjects[2], attended: 28, total: 30 },
  { subject: subjects[3], attended: 25, total: 30 }
];

const exams = [
  "Semester End Exam", "Mid-Term Exam", "Makeup Exam", "Resit Exam"
];

export default function HomePage() {
  const [role, setRole] = useState<Role>("Student");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [authUserId, setAuthUserId] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<Section>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [events, setEvents] = useState([
    "Department orientation — 12 November",
    "Tech symposium — 18 November"
  ]);

  const [quizTitle, setQuizTitle] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [attendance, setAttendance] = useState(initialAttendance);

  const [equipment, setEquipment] = useState([
    { name: "Projector P01 — CSE Lab", status: "Available", usage: 42 },
    { name: "Monitor M04 — IoT Lab", status: "In use", usage: 76 },
    { name: "Arduino Kit A12 — IoT Lab", status: "Available", usage: 31 }
  ]);

  const [availableAssignments, setAvailableAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [uploading, setUploading] = useState(false);

  const items = role === "Student" ? studentItems : facultyItems;

  const average = Math.round(
    attendance.reduce((a, x) => a + x.attended / x.total, 0) /
    attendance.length * 100
  );

  const activeIcon = useMemo(
    () => items.find(x => x[0] === section)?.[1] ?? Home,
    [items, section]
  );

  async function loadAssignmentData(currentRole: Role, currentUserId: string) {
    setLoadingAssignments(true);

    try {
      let assignmentQuery = supabase
        .from("assignments")
        .select("id,title,description,deadline")
        .order("created_at", { ascending: false });

      if (currentRole === "Faculty") {
        assignmentQuery = assignmentQuery.eq("faculty_id", currentUserId);
      }

      const { data: assignmentData, error: assignmentError } =
        await assignmentQuery;

      if (assignmentError) {
        setNotice("Could not load assignments: " + assignmentError.message);
      } else {
        setAvailableAssignments(assignmentData ?? []);
      }

      let submissionQuery = supabase
        .from("assignment_submissions")
        .select(
          "id,assignment_id,student_id,file_path,status,submitted_at,marks,faculty_feedback"
        )
        .order("submitted_at", { ascending: false });

      if (currentRole === "Student") {
        submissionQuery = submissionQuery.eq("student_id", currentUserId);
      }

      const { data: submissionData, error: submissionError } =
        await submissionQuery;

      if (submissionError) {
        setSubmissions([]);
        setNotice(
          "Assignments loaded, but submissions could not be loaded: " +
          submissionError.message
        );
      } else {
        setSubmissions(submissionData ?? []);
      }
    } catch {
      setNotice("Something went wrong while loading assignments.");
    } finally {
      setLoadingAssignments(false);
    }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      setNotice("Enter your ID and password.");
      return;
    }

    setLoginLoading(true);
    setNotice("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: userId.trim(),
          password,
          role: role.toLowerCase()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setNotice(result.error || "Login failed. Check your details.");
        return;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token
      });

      if (error) {
        setNotice("Could not start your session: " + error.message);
        return;
      }

      const currentUserId = data.user?.id || result.user.id;

      setAuthUserId(currentUserId);
      setLoggedIn(true);
      setSection("Overview");
      setPassword("");
      setNotice("");

      await loadAssignmentData(role, currentUserId);
    } catch {
      setNotice("Unable to connect to the server. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedAssignmentId) {
      setNotice("Please select an assignment first.");
      e.target.value = "";
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") &&
        file.type !== "application/pdf") {
      setNotice("Please select a PDF file.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setNotice("The PDF must be smaller than 10 MB.");
      e.target.value = "";
      return;
    }

    if (!authUserId) {
      setNotice("Your login session is missing. Please sign in again.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setNotice("");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath =
      `${selectedAssignmentId}/${authUserId}/${Date.now()}-${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("assignment-files")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false
        });

      if (uploadError) {
        setNotice("PDF upload failed: " + uploadError.message);
        return;
      }

      const { error: insertError } = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: selectedAssignmentId,
          student_id: authUserId,
          file_path: filePath,
          status: "submitted"
        });

      if (insertError) {
        await supabase.storage
          .from("assignment-files")
          .remove([filePath]);

        setNotice("File uploaded, but submission could not be saved: " +
          insertError.message);
        return;
      }

      setNotice("Your assignment PDF was submitted successfully!");

      await loadAssignmentData("Student", authUserId);
    } catch {
      setNotice("Something went wrong while uploading your PDF.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function downloadSubmission(filePath: string) {
    const { data, error } = await supabase.storage
      .from("assignment-files")
      .createSignedUrl(filePath, 60);

    if (error || !data?.signedUrl) {
      setNotice("Could not open this PDF: " +
        (error?.message || "No download link returned."));
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function action(message: string) {
    setNotice(message);
  }

  function addEvent() {
    if (!newEvent.trim()) return;

    setEvents(old => [newEvent.trim(), ...old]);
    setNewEvent("");
    setNotice("Event added in this browser session.");
  }

  async function logout() {
    await supabase.auth.signOut();

    setLoggedIn(false);
    setAuthUserId("");
    setPassword("");
    setNotice("");
    setAvailableAssignments([]);
    setSubmissions([]);
    setSelectedAssignmentId("");
    setSection("Overview");
  }

  if (!loggedIn) {
    return (
      <main className="loginShell">
        <div className="loginBrand">
          <div className="brandMark"><GraduationCap size={34} /></div>
          <p className="eyebrow">GM UNIVERSITY</p>
          <h1>GMU <span>Connect</span></h1>
          <p className="muted">Your campus. One connected experience.</p>

          <div className="loginFeatures">
            <div><CheckCircle2 /> Academic services in one place</div>
            <div><CheckCircle2 /> Student and faculty portals</div>
            <div><CheckCircle2 /> Campus resources and updates</div>
          </div>
        </div>

        <form className="loginCard" onSubmit={login}>
          <p className="eyebrow gold">WELCOME TO GMU</p>
          <h2>Sign in to continue</h2>
          <p className="muted">Choose your portal and enter your details.</p>

          <div className="roleSwitch">
            {(["Student", "Faculty"] as Role[]).map(r => (
              <button
                type="button"
                className={role === r ? "selected" : ""}
                onClick={() => {
                  setRole(r);
                  setNotice("");
                }}
                key={r}
              >
                {r === "Student" ? <GraduationCap /> : <Users />}
                {r}
              </button>
            ))}
          </div>

          <label>{role === "Student" ? "Student USN" : "Faculty ID"}</label>
          <input
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder={role === "Student" ? "Enter student ID" : "Enter faculty ID"}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
          />

          {notice && <p className="notice">{notice}</p>}

          <button className="primary full" type="submit" disabled={loginLoading}>
            {loginLoading ? "Signing in..." : "Sign in"}
            <ChevronRight size={18} />
          </button>

          <p className="demoNote">
            Sign in using your university ID and password.
          </p>
        </form>

        <footer className="loginFooter">
          GM University · GMU Connect
        </footer>
      </main>
    );
  }

  const Icon = activeIcon;

  return (
    <div className="appShell">
      {mobileOpen && (
        <button
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sideBrand">
          <div className="smallMark"><GraduationCap /></div>
          <div>
            <b>GMU <span>Connect</span></b>
            <small>GM UNIVERSITY</small>
          </div>
          <button
            className="closeMenu"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </button>
        </div>

        <div className="portalTag">{role} Portal</div>

        <nav>
          {items.map(([name, I]) => (
            <button
              key={name}
              className={section === name ? "navItem active" : "navItem"}
              onClick={() => {
                setSection(name);
                setMobileOpen(false);
                setNotice("");
                if (
                  name === "Assignments" ||
                  name === "Assignment Review"
                ) {
                  loadAssignmentData(role, authUserId);
                }
              }}
            >
              <I size={18} />
              <span>{name}</span>
              <ChevronRight className="navArrow" size={15} />
            </button>
          ))}
        </nav>

        <div className="sideBottom">
          <div className="userMini">
            <div className="avatar">{role[0]}</div>
            <div>
              <b>{userId}</b>
              <small>{role}</small>
            </div>
          </div>

          <button className="logout" onClick={logout}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <button className="menuBtn" onClick={() => setMobileOpen(true)}>
            <Menu />
          </button>

          <div>
            <p className="eyebrow">
              GM UNIVERSITY / {role.toUpperCase()}
            </p>
            <h2>{section}</h2>
          </div>

          <div className="topActions">
            <span className="today">Academic Portal</span>
            <div className="avatar">{role[0]}</div>
          </div>
        </header>

        <div className="content">
          {notice && (
            <div className="noticeBar">
              <span>{notice}</span>
              <button onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}

          {section === "Overview" ? (
            <Overview
              role={role}
              userId={userId}
              average={average}
              events={events}
              setSection={setSection}
            />
          ) : (
            <Service
              section={section}
              role={role}
              average={average}
              attendance={attendance}
              setAttendance={setAttendance}
              events={events}
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              addEvent={addEvent}
              availableAssignments={availableAssignments}
              submissions={submissions}
              selectedAssignmentId={selectedAssignmentId}
              setSelectedAssignmentId={setSelectedAssignmentId}
              uploadFile={uploadFile}
              uploading={uploading}
              loadingAssignments={loadingAssignments}
              downloadSubmission={downloadSubmission}
              quizTitle={quizTitle}
              setQuizTitle={setQuizTitle}
              action={action}
              equipment={equipment}
              setEquipment={setEquipment}
            />
          )}

          <div className="footerNote">
            GMU Connect · Academic Portal
            <span>•</span>
            Assignment files are stored securely
          </div>
        </div>
      </main>
    </div>
  );
}

function Overview({ role, userId, average, events, setSection }: any) {
  const stats = role === "Student"
    ? [
        ["Attendance", `${average}%`],
        ["Courses", "04"],
        ["Upcoming Exams", "04"],
        ["New Events", String(events.length)]
      ]
    : [
        ["My Courses", "04"],
        ["Pending Reviews", "08"],
        ["Upcoming Classes", "06"],
        ["Lab Resources", "03"]
      ];

  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow gold">YOUR CAMPUS, CONNECTED</p>
          <h1>Welcome back, {userId}</h1>
          <p>Here is your {role.toLowerCase()} portal at a glance.</p>
        </div>
        <div className="welcomeIcon"><GraduationCap size={42} /></div>
      </div>

      <div className="statGrid">
        {stats.map(([a, b]: string[]) => (
          <div className="statCard" key={a}>
            <span>{a}</span>
            <strong>{b}</strong>
            <small>Portal overview</small>
          </div>
        ))}
      </div>

      <div className="twoCols">
        <section className="panel">
          <div className="panelHead">
            <h3>Quick access</h3>
            <span>Services</span>
          </div>

          <div className="quickGrid">
            {(role === "Student" ? studentItems : facultyItems)
              .slice(1, 7)
              .map(([n, I]: any) => (
                <button key={n} onClick={() => setSection(n)}>
                  <I />
                  <span>{n}</span>
                  <ChevronRight size={15} />
                </button>
              ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelHead">
            <h3>Campus announcements</h3>
            <Bell size={18} />
          </div>

          {events.slice(0, 4).map((e: string) => (
            <div className="eventLine" key={e}>
              <div className="eventDot" />
              <span>{e}</span>
            </div>
          ))}

          <button
            className="textButton"
            onClick={() =>
              setSection(role === "Student" ? "Campus Events" : "Event Manager")
            }
          >
            View events <ChevronRight size={15} />
          </button>
        </section>
      </div>
    </>
  );
}

function Service(props: any) {
  const {
    section, role, average, attendance, setAttendance,
    events, newEvent, setNewEvent, addEvent,
    availableAssignments, submissions, selectedAssignmentId,
    setSelectedAssignmentId, uploadFile, uploading,
    loadingAssignments, downloadSubmission,
    quizTitle, setQuizTitle, action, equipment, setEquipment
  } = props;

  const isFaculty = role === "Faculty";

  const title = (s: string) => (
    <div className="sectionIntro">
      <p className="eyebrow gold">
        {isFaculty ? "FACULTY WORKSPACE" : "STUDENT SERVICES"}
      </p>
      <h1>{s}</h1>
      <p>Access and manage your university information from one place.</p>
    </div>
  );

  if (section === "Attendance" || section === "Attendance Manager") {
    return (
      <>
        {title(section)}
        <div className="panel">
          <div className="panelHead">
            <h3>{isFaculty ? "Mark subject attendance" : "Subject-wise attendance"}</h3>
            <b className="pill">{average}% overall</b>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Subject</th><th>Attended</th><th>Total</th>
                  <th>Percentage</th>
                  {isFaculty && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {attendance.map((a: any, i: number) => (
                  <tr key={a.subject}>
                    <td>{a.subject}</td>
                    <td>{a.attended}</td>
                    <td>{a.total}</td>
                    <td>
                      <b>{Math.round(a.attended / a.total * 100)}%</b>
                      <div className="progress">
                        <i style={{ width: `${a.attended / a.total * 100}%` }} />
                      </div>
                    </td>
                    {isFaculty && (
                      <td>
                        <button
                          className="smallBtn"
                          onClick={() => setAttendance((old: any) =>
                            old.map((x: any, j: number) =>
                              j === i
                                ? { ...x, attended: Math.min(x.total, x.attended + 1) }
                                : x
                            )
                          )}
                        >
                          Mark present
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="hint">
            Sample data for layout testing. Connect authorized university records before relying on these values.
          </p>
        </div>
      </>
    );
  }

  if (section === "Courses" || section === "Courses & Materials") {
    return (
      <>
        {title(section)}
        <div className="courseGrid">
          {subjects.map((s, i) => (
            <div className="courseCard" key={s}>
              <div className="courseIcon"><BookOpen /></div>
              <small>COURSE 0{i + 1}</small>
              <h3>{s}</h3>
              <p>
                {isFaculty
                  ? "Upload unit-wise notes and PDFs for this subject."
                  : "View your course details and learning materials."}
              </p>
              <button
                className="outlineBtn"
                onClick={() => action("Course materials need to be connected to Supabase Storage.")}
              >
                {isFaculty ? <><Upload size={15} /> Add material</> : "View materials"}
                <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === "Exams") {
    return (
      <>
        {title(section)}
        <div className="listPanel">
          {exams.map((x, i) => (
            <div className="listRow" key={x}>
              <div className="rowIcon"><CalendarDays /></div>
              <div>
                <b>{x}</b>
                <small>{i === 0 ? "End of semester assessment" : "Assessment type"}</small>
              </div>
              <span className="pill">Scheduled details pending</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === "Results" || section === "Marks & Grades") {
    return (
      <>
        {title(section)}
        <div className="statGrid">
          <div className="statCard"><span>CGPA</span><strong>—</strong><small>Awaiting verified results</small></div>
          <div className="statCard"><span>Credits earned</span><strong>—</strong><small>Not connected</small></div>
          <div className="statCard"><span>Technical competency</span><strong>—</strong><small>Not connected</small></div>
        </div>
        <div className="panel">
          <h3>{isFaculty ? "Marks entry" : "Subject-wise results"}</h3>
          <p className="hint">Official grades and marks will appear here after the university database is connected.</p>
          {isFaculty && (
            <button className="primary" onClick={() => action("Marks entry form will be connected to the secure results database.")}>
              Enter marks
            </button>
          )}
        </div>
      </>
    );
  }

  if (
    section === "Quizzes" || section === "Quiz Builder" ||
    section === "Quiz Results" || section === "Quiz Analyser"
  ) {
    return (
      <>
        {title(section)}
        <div className="panel">
          <h3>{isFaculty ? "Create a quiz" : "Available quizzes"}</h3>
          {isFaculty ? (
            <>
              <label>Quiz title</label>
              <input
                value={quizTitle}
                onChange={(e: any) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
              <button
                className="primary topGap"
                onClick={() => {
                  if (quizTitle.trim()) {
                    action(`Quiz "${quizTitle}" drafted. Add questions and connect database to publish.`);
                    setQuizTitle("");
                  }
                }}
              >
                <Plus size={16} /> Create quiz
              </button>
            </>
          ) : (
            <>
              <div className="emptyState">
                <ClipboardList />
                <b>No published quizzes yet</b>
                <span>Faculty-created quizzes will appear here.</span>
              </div>
              <button className="outlineBtn" onClick={() => action("Quiz results will appear after you submit a published quiz.")}>
                View quiz results
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  if (section === "Timetable" || section === "Academic Planner") {
    return (
      <>
        {title(section)}
        <div className="panel">
          <div className="panelHead">
            <h3>Weekly timetable</h3>
            <span className="pill">Sample layout</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Day</th><th>09:00–10:00</th><th>10:00–11:00</th>
                  <th>11:15–12:15</th><th>01:00–02:00</th>
                </tr>
              </thead>
              <tbody>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d, i) => (
                  <tr key={d}>
                    <td><b>{d}</b></td>
                    {[0, 1, 2, 3].map(n => (
                      <td key={n}>{subjects[(i + n) % 4].split(" ")[0]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">Replace this sample timetable with the official timetable feed.</p>
        </div>
      </>
    );
  }

  if (section === "Fee Payment") {
    return (
      <>
        {title(section)}
        <div className="courseGrid">
          {["Course registration fee", "Tuition fee", "Hostel fee"].map(x => (
            <div className="courseCard" key={x}>
              <div className="courseIcon"><CreditCard /></div>
              <h3>{x}</h3>
              <p>Payment status will be shown after finance integration.</p>
              <button className="outlineBtn" onClick={() => action("Online payments are not enabled. A verified payment gateway must be configured first.")}>
                Payment details <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>
        <p className="hint">Do not enter card or banking details into this prototype.</p>
      </>
    );
  }

  if (section === "Assignments" || section === "Assignment Review") {
    return (
      <>
        {title(section)}

        <div className="panel">
          <div className="panelHead">
            <h3>{isFaculty ? "Student submissions" : "Available assignments"}</h3>
            <button
              className="smallBtn"
              onClick={() => action("Use the Assignments menu to refresh the list.")}
            >
              {loadingAssignments ? "Loading..." : "Assignment portal"}
            </button>
          </div>

          {loadingAssignments && <p className="hint">Loading assignments...</p>}

          {!isFaculty && (
            <>
              {availableAssignments.length > 0 ? (
                <>
                  <label>Select assignment</label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e: any) => setSelectedAssignmentId(e.target.value)}
                  >
                    <option value="">Choose an assignment</option>
                    {availableAssignments.map((a: Assignment) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>

                  {selectedAssignmentId && (() => {
                    const selected = availableAssignments.find(
                      (a: Assignment) => a.id === selectedAssignmentId
                    );

                    return selected ? (
                      <div className="listRow">
                        <div>
                          <b>{selected.title}</b>
                          <small>{selected.description || "No description provided."}</small>
                          {selected.deadline && (
                            <small>
                              Deadline: {new Date(selected.deadline).toLocaleString()}
                            </small>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <label className="uploadBox">
                    <Upload />
                    <b>{uploading ? "Uploading PDF..." : "Choose a PDF file"}</b>
                    <span>PDF files only · Maximum size 10 MB</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={uploading || !selectedAssignmentId}
                      onChange={uploadFile}
                    />
                  </label>
                </>
              ) : (
                <div className="emptyState">
                  <FileText />
                  <b>No assignments available</b>
                  <span>Assignments for your enrolled subjects will appear here.</span>
                </div>
              )}
            </>
          )}

          {isFaculty && (
            <>
              {submissions.length > 0 ? (
                submissions.map((s: Submission) => {
                  const assignment = availableAssignments.find(
                    (a: Assignment) => a.id === s.assignment_id
                  );

                  return (
                    <div className="listRow" key={s.id}>
                      <FileText />
                      <div>
                        <b>{assignment?.title || "Assignment submission"}</b>
                        <small>Student ID: {s.student_id}</small>
                        <small>Status: {s.status}</small>
                        {s.submitted_at && (
                          <small>
                            Submitted: {new Date(s.submitted_at).toLocaleString()}
                          </small>
                        )}
                      </div>
                      <button
                        className="smallBtn"
                        onClick={() => downloadSubmission(s.file_path)}
                      >
                        <Download size={15} /> Download PDF
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="emptyState">
                  <FileText />
                  <b>No submissions loaded</b>
                  <span>Student submissions will appear here when available.</span>
                </div>
              )}
            </>
          )}

          {!isFaculty && (
            <>
              <div className="panelHead">
                <h3>My submitted assignments</h3>
              </div>

              {submissions.length > 0 ? (
                submissions.map((s: Submission) => {
                  const assignment = availableAssignments.find(
                    (a: Assignment) => a.id === s.assignment_id
                  );

                  return (
                    <div className="listRow" key={s.id}>
                      <FileText />
                      <div>
                        <b>{assignment?.title || "Assignment"}</b>
                        <small>Status: {s.status}</small>
                        {s.submitted_at && (
                          <small>
                            Submitted: {new Date(s.submitted_at).toLocaleString()}
                          </small>
                        )}
                      </div>
                      <button
                        className="smallBtn"
                        onClick={() => downloadSubmission(s.file_path)}
                      >
                        <Download size={15} /> View PDF
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="emptyState">
                  <FileText />
                  <b>No files submitted yet</b>
                  <span>Your uploaded assignment PDFs will appear here.</span>
                </div>
              )}
            </>
          )}
        </div>
      </>
    );
  }

  if (section === "Campus Events" || section === "Event Manager") {
    return (
      <>
        {title(section)}
        <div className="panel">
          <h3>{isFaculty ? "Publish an event" : "Upcoming campus events"}</h3>
          {isFaculty && (
            <div className="inlineForm">
              <input
                value={newEvent}
                onChange={(e: any) => setNewEvent(e.target.value)}
                placeholder="Event name and date"
              />
              <button className="primary" onClick={addEvent}>
                <Plus size={16} /> Add
              </button>
            </div>
          )}
          {events.map((e: string) => (
            <div className="eventLine" key={e}>
              <div className="eventDot" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === "Campus Map") {
    return (
      <>
        {title(section)}
        <div className="mapPlaceholder">
          <MapPin size={38} />
          <h3>GM University campus map</h3>
          <p>Add verified campus locations and building routes here.</p>
          <div className="mapLocations">
            {["Classrooms", "Seminar Halls", "Departments", "Laboratories", "Library", "Administrative Office"].map(x => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (section === "Emergency & Safety") {
    return (
      <>
        {title(section)}
        <div className="courseGrid">
          {[
            ["University security", "Add verified number"],
            ["Ambulance", "112 (India emergency number)"],
            ["Fire & rescue", "101"],
            ["Police", "112"]
          ].map(([a, b]) => (
            <div className="courseCard" key={a}>
              <div className="courseIcon"><ShieldAlert /></div>
              <h3>{a}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
        <p className="hint">Confirm university-specific contact numbers with GMU before publishing.</p>
      </>
    );
  }

  if (section === "Digital Whiteboard") {
    return (
      <>
        {title(section)}
        <div className="panel">
          <h3>Teaching whiteboard</h3>
          <textarea className="whiteboard" placeholder="Type lesson notes here..." />
          <button className="outlineBtn topGap" onClick={() => action("Notes are temporary in this prototype. Add cloud saving in the next stage.")}>
            Save notes
          </button>
        </div>
      </>
    );
  }

  if (section === "Lab Equipment") {
    return (
      <>
        {title(section)}
        <div className="panel">
          <h3>Equipment availability</h3>
          {equipment.map((x: any, i: number) => (
            <div className="equipmentRow" key={x.name}>
              <div>
                <b>{x.name}</b>
                <small>{x.usage}% usage</small>
                <div className="progress">
                  <i style={{ width: `${x.usage}%` }} />
                </div>
              </div>
              <span className={x.status === "Available" ? "pill green" : "pill"}>
                {x.status}
              </span>
              <button
                className="smallBtn"
                onClick={() => setEquipment((old: any) =>
                  old.map((z: any, j: number) =>
                    j === i
                      ? { ...z, status: z.status === "Available" ? "Booked" : "Available" }
                      : z
                  )
                )}
              >
                Book / release
              </button>
            </div>
          ))}
          <p className="hint">Availability here is manually simulated, not live device monitoring.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {title(section)}
      <div className="panel">
        <div className="emptyState">
          <Settings />
          <b>Service setup</b>
          <span>This section is ready for its university data integration.</span>
        </div>
      </div>
    </>
  );
}
