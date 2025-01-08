import fetch from "node-fetch";
import makeFetchCookie from "fetch-cookie";
import fs from "fs/promises";

const fetchCookie = makeFetchCookie(fetch);

const majors = [
  "AE",
  "ARE",
  "AS",
  "BIOE",
  "CHE",
  "CHEM",
  "CIE",
  "COE",
  "CS",
  "EE",
  "FIN",
  "GEOL",
  "GEOP",
  "HRM",
  "ISE",
  "ITD",
  "MATH",
  "ME",
  "MIS",
  "MINE",
  "MKT",
  "MSE",
  "PETE",
  "PHYS",
  "SSC",
  "SWE",
];

const randomGen = () => {
  let random = "";
  for (let i = 0; i < 14; i++) {
    random += Math.floor(Math.random() * 10);
  }
  return random;
};

async function fetchCourses(major, term) {
  try {
    const random = randomGen();
    const formData = new URLSearchParams();
    formData.append("term", term);
    formData.append("uniqueSessionId", random);

    // Map "CS" to "ICS" if the major is "CS"
    const effectiveMajor = major === "CS" ? "ICS" : major;

    // Step 1: Initialize session
    const initResponse = await fetchCookie(
      "https://banner9-registration.kfupm.edu.sa/StudentRegistrationSsb/ssb/registration"
    );
    console.log("Step 1 Response Status:", initResponse.status);

    // Step 2: Select term
    const termSelectResponse = await fetchCookie(
      "https://banner9-registration.kfupm.edu.sa/StudentRegistrationSsb/ssb/term/termSelection?mode=search"
    );
    console.log("Step 2 Response Status:", termSelectResponse.status);

    // Step 3: Get available terms
    const termsResponse = await fetchCookie(
      `https://banner9-registration.kfupm.edu.sa/StudentRegistrationSsb/ssb/classSearch/getTerms?searchTerm=&offset=1&max=10`
    );
    console.log("Step 3 Response Status:", termsResponse.status);
    const terms = await termsResponse.json();
    console.log("Available Terms:", terms);

    // Step 4: Set the selected term
    const termSetResponse = await fetchCookie(
      "https://banner9-registration.kfupm.edu.sa/StudentRegistrationSsb/ssb/term/search?mode=search",
      {
        method: "POST",
        body: formData,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("Step 4 Response Status:", termSetResponse.status);

    // Step 5: Fetch courses for the major
    const courseResponse = await fetchCookie(
      `https://banner9-registration.kfupm.edu.sa/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_subject=${effectiveMajor}&txt_term=${term}&startDatepicker=&endDatepicker=&pageOffset=0&pageMaxSize=1000&sortColumn=subjectDescription&sortDirection=asc`,
      {
        headers: {
          "Cache-Control": "max-age=120",
        },
      }
    );

    const res = await courseResponse.json();

    console.log("Raw response for major:", major, JSON.stringify(res, null, 2));

    const data = res.data;
    if (!data || data.length === 0) {
      console.log(`No courses found for ${major}`);
      return [];
    }

    const uniqueCourses = Array.from(
      new Set(data.map((course) => course.subjectCourse))
    ).map((subjectCourse) => ({
      id: subjectCourse.toLowerCase(),
      name: subjectCourse,
      quizzes: "Quizzes",
      exams: "Old Exams",
      notes: "Notes",
    }));

    console.log(`Fetched ${uniqueCourses.length} courses for ${major}`);
    return uniqueCourses;
  } catch (error) {
    console.error(
      `Error fetching courses for ${major}:`,
      error.message || error
    );
    return [];
  }
}

async function fetchAllCourses() {
  const allCourses = {};
  const term = "202410"; // Specify the desired term

  for (const major of majors) {
    console.log(`Fetching courses for ${major}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay between requests

    const courses = await fetchCourses(major, term);
    if (courses.length > 0) {
      allCourses[major] = courses;
    }
  }

  await fs.writeFile(
    "./backend/courses.json",
    JSON.stringify(allCourses, null, 2),
    "utf-8"
  );

  console.log("All courses fetched and saved to courses.json!");
}

fetchAllCourses();
