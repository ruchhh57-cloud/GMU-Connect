 "use client";

import { useMemo, useState } from "react";
import {
  GraduationCap, Users, LayoutDashboard, CalendarDays, BookOpen, ClipboardCheck,
  FileText, Trophy, CreditCard, MapPin, ShieldAlert, FlaskConical, Bell, LogOut,
  Search, Menu, X, Plus, Upload, CheckCircle2, Clock3, ChartNoAxesCombined,
  ClipboardList, Presentation, Wrench, ChevronRight, Home, Settings, Download
} from "lucide-react";

type Role = "Student" | "Faculty";
type Section = string;

const studentItems = [
  ["Overview", LayoutDashboard], ["Attendance", ClipboardCheck], ["Courses", BookOpen],
  ["Exams", CalendarDays], ["Results", Trophy], ["Quizzes", ClipboardList],
  ["Quiz Results", ChartNoAxesCombined], ["Timetable", CalendarDays],
  ["Fee Payment", CreditCard], ["Assignments", FileText], ["Campus Events", Bell],
  ["Campus Map", MapPin], ["Emergency & Safety", ShieldAlert]
] as const;
const facultyItems = [
  ["Overview", LayoutDashboard], ["Attendance Manager", ClipboardCheck],
  ["Courses & Materials", BookOpen], ["Marks & Grades", Trophy],
  ["Digital Whiteboard", Presentation], ["Academic Planner", CalendarDays],
  ["Quiz Builder", ClipboardList], ["Quiz Analyser", ChartNoAxesCombined],
  ["Timetable", CalendarDays], ["Assignment Review", FileText],
  ["Event Manager", Bell], ["Campus Map", MapPin], ["Emergency & Safety", ShieldAlert],
  ["Lab Equipment", FlaskConical]
] as const;

const subjects = ["Discrete Structures of Computing", "Operating System", "Object-Oriented Programming", "Computer Organization and Architecture"];
const initialAttendance = [
  { subject: subjects[0], attended: 27, total: 30 },
  { subject: subjects[1], attended: 24, total: 30 },
  { subject: subjects[2], attended: 28, total: 30 },
  { subject: subjects[3], attended: 25, total: 30 }
];
const exams = ["Semester End Exam", "Mid-Term Exam", "Makeup Exam", "Resit Exam"];

export default function HomePage() {
  const [role, setRole] = useState<Role>("Student");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<Section>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [events, setEvents] = useState(["Department orientation — 12 November", "Tech symposium — 18 November"]);
  const [assignments, setAssignments] = useState<string[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [attendance, setAttendance] = useState(initialAttendance);
  const [equipment, setEquipment] = useState([
    { name: "Projector P01 — CSE Lab", status: "Available", usage: 42 },
    { name: "Monitor M04 — IoT Lab", status: "In use", usage: 76 },
    { name: "Arduino Kit A12 — IoT Lab", status: "Available", usage: 31 }
  ]);

  const items = role === "Student" ? studentItems : facultyItems;
  const average = Math.round(attendance.reduce((a, x) => a + x.attended / x.total, 0) / attendance.length * 100);
  const activeIcon = useMemo(() => items.find(x => x[0] === section)?.[1] ?? Home, [items, section]);

  function login(e: React.FormEvent) {
    async function login(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!userId.trim() || !password.trim()) {
    setNotice("Enter your ID and password.");
    return;
  }

  setNotice("Signing in...");

  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        universityId: userId.trim(),
        password: password,
        role: role.toLowerCase(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setNotice(result.error || "Invalid login details.");
      return;
    }

    setLoggedIn(true);
    setSection("Overview");
    setNotice("");
  } catch (error) {
    setNotice("Unable to connect. Please try again.");
  }
}
