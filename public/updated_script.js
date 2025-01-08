// Apply theme before the DOM loads to prevent flickering
(function applyThemeOnLoad() {
  const isDarkMode = localStorage.getItem("dark-mode") === "true";
  document.documentElement.classList.toggle("dark-mode", isDarkMode);

  const darkModeStyles = document.getElementById("dark-mode-styles");
  if (darkModeStyles) darkModeStyles.disabled = !isDarkMode;
})();

document.addEventListener("DOMContentLoaded", async () => {
  const themeToggle = document.getElementById("theme-toggle");
  const darkModeStyles = document.getElementById("dark-mode-styles");

  // Set the initial icon state based on localStorage
  const isDarkMode = localStorage.getItem("dark-mode") === "true";
  themeToggle.textContent = isDarkMode ? "🌙" : "☀️";

  // Toggle theme
  themeToggle?.addEventListener("click", () => {
    const isDarkMode =
      !document.documentElement.classList.contains("dark-mode");
    localStorage.setItem("dark-mode", isDarkMode);
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
    if (darkModeStyles) darkModeStyles.disabled = !isDarkMode;
    themeToggle.textContent = isDarkMode ? "🌙" : "☀️";
  });

  // Set text and add event listener for the "Your Courses" tab
  const yourCoursesTab = document.getElementById("your-courses");

  if (yourCoursesTab) {
    yourCoursesTab.addEventListener("click", () => {
      window.location.href = "/your-courses"; // Correct path
    });
  }

  // Navigation for "Discover Files" and "Add Yours!"
  const discoverFilesBtn = document.getElementById("discover-files");
  const addYoursBtn = document.getElementById("add-yours");

  discoverFilesBtn?.addEventListener("click", () => {
    window.location.href = "/general-courses";
  });

  addYoursBtn?.addEventListener("click", () => {
    window.location.href = "/add-files";
  });

  // Tab navigation logic for all pages
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const target = e.target.textContent.trim();
      if (target === "Your Courses") window.location.href = "/your-courses";
      else if (target === "Files by Majors")
        window.location.href = "/files-by-majors";
      else if (target === "General Courses")
        window.location.href = "/general-courses";
    });
  });

  // Update heart state (filled or empty)
  const updateHeartState = (heart, isLiked) => {
    heart.textContent = isLiked ? "❤️" : "🤍";
  };

  const toggleCardInYourCourses = async (card, userEmail) => {
    const cardId = card.getAttribute("data-id");

    if (!cardId) return;

    const heartIcon = card.querySelector(".heart-icon");

    if (heartIcon.textContent === "❤️") {
      // Remove liked course from the database
      try {
        const response = await fetch(
          `/liked-courses?userEmail=${userEmail}&courseId=${cardId}`,
          { method: "DELETE" }
        );
        if (response.ok) {
          heartIcon.textContent = "🤍"; // Update heart icon to empty
        }
      } catch (error) {
        console.error("Error removing liked course:", error);
      }
    } else {
      // Add liked course to the database
      try {
        const response = await fetch("/liked-courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail, courseId: cardId }),
        });
        if (response.ok) {
          heartIcon.textContent = "❤️"; // Update heart icon to filled
        }
      } catch (error) {
        console.error("Error liking course:", error);
      }
    }
  };

  const loadLikedCourses = async () => {
    const userEmail = localStorage.getItem("userEmail"); // Retrieve userEmail from localStorage
    const yourCoursesContainer = document.getElementById("your-courses");

    if (!userEmail) {
      console.error("User email is missing. Please sign in.");
      return;
    }

    try {
      // Fetch liked courses from the server using userEmail
      const response = await fetch(
        `/liked-courses?userEmail=${encodeURIComponent(userEmail)}`
      );
      const likedCourses = await response.json();

      // Clear existing content in the container
      yourCoursesContainer.innerHTML = "";

      // Populate liked courses dynamically
      likedCourses.forEach((course) => {
        const courseCard = document.createElement("div");
        courseCard.classList.add("card");
        courseCard.setAttribute("data-id", course.courseId);

        // Add hover content structure
        courseCard.innerHTML = `
          <div class="card-header">
            <h3>${course.courseId}</h3>
            <span class="heart-icon">❤️</span>
          </div>
          <div class="hover-content">
            <a href="#" class="hover-link">Quizzes</a>
            <a href="#" class="hover-link">Old Exams</a>
            <a href="#" class="hover-link">Notes</a>
          </div>
        `;

        yourCoursesContainer.appendChild(courseCard);
      });

      console.log("Liked courses loaded successfully!");
    } catch (error) {
      console.error("Error loading liked courses:", error);
    }
  };

  if (window.location.pathname.includes("your-courses")) {
    loadLikedCourses();
  }

  // Load saved heart state on page load
  const loadHeartStateOnPageLoad = async () => {
    const userEmail = localStorage.getItem("userEmail"); // Get userEmail from localStorage
    if (!userEmail) return;

    try {
      // Fetch liked courses from the server
      const response = await fetch(`/liked-courses?userEmail=${userEmail}`);
      const likedCourses = await response.json();

      // Get course IDs of liked courses
      const likedCourseIds = likedCourses.map((course) => course.courseId);

      // Update heart icons for liked courses
      document.querySelectorAll(".card").forEach((card) => {
        const cardId = card.getAttribute("data-id");
        const heartIcon = card.querySelector(".heart-icon");

        // Mark as liked if the course ID is in the liked list
        if (likedCourseIds.includes(cardId)) {
          heartIcon.textContent = "❤️";
        } else {
          heartIcon.textContent = "🤍";
        }
      });
    } catch (error) {
      console.error("Error loading liked courses:", error);
    }
  };

  // Event delegation to toggle hearts dynamically
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("heart-icon")) {
      const heartIcon = e.target;
      const card = heartIcon.closest(".card");

      // Check if user is signed in
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        alert("You need to sign in to like a course!");
        return;
      }

      // Pass the email instead of userId to backend
      toggleCardInYourCourses(card, userEmail);
    }
  });

  // Load saved cards into "Your Courses" on load
  if (window.location.pathname.includes("your-courses")) {
    console.log("Running loader for your_courses.html");

    const yourCoursesContainer = document.getElementById("your-courses");
    if (yourCoursesContainer) {
      const savedCards = JSON.parse(localStorage.getItem("your-courses")) || [];
      console.log("Loaded Saved Cards:", savedCards);

      savedCards.forEach((savedCard) => {
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = savedCard.html;
        const cardNode = tempContainer.firstElementChild;
        if (cardNode) {
          yourCoursesContainer.appendChild(cardNode);
          console.log("Appending card to Your Courses:", cardNode);
        }
      });
    } else {
      console.error("Your Courses container not found!");
    }
  }

  // Prevent saved cards from rendering on the homepage or other tabs
  if (!window.location.pathname.endsWith("/your-courses")) {
    const yourCoursesContainer = document.getElementById("your-courses");
    if (yourCoursesContainer) {
      yourCoursesContainer.innerHTML = ""; // Clear the container
    }
  }

  // Populate Major Courses Page
  const majorNameElement = document.getElementById("major-name");
  const courseCardsContainer = document.getElementById("course-cards");
  const urlParams = new URLSearchParams(window.location.search);
  const selectedMajor = urlParams.get("major");

  if (majorNameElement && courseCardsContainer && selectedMajor) {
    try {
      // Fetch the courses data from the backend
      const response = await fetch("/courses");
      if (!response.ok) throw new Error("Failed to load courses data");

      const courses = await response.json(); // Parse the response as JSON

      // Update DOM with the fetched data
      majorNameElement.textContent = `${selectedMajor} Courses`;
      document.title = `${selectedMajor} Courses`;

      const majorCourses = courses[selectedMajor] || [];

      if (majorCourses.length > 0) {
        majorCourses.forEach((course) => {
          const courseCard = document.createElement("div");
          courseCard.classList.add("card");
          courseCard.setAttribute("data-id", course.id);
          courseCard.innerHTML = `
            <div class="card-header">
              <h3>${course.name}</h3>
              <span class="heart-icon">🤍</span>
            </div>
            <div class="hover-content">
              <a href="#" class="hover-link">${course.quizzes}</a>
              <a href="#" class="hover-link">${course.exams}</a>
              <a href="#" class="hover-link">${course.notes}</a>
            </div>
          `;
          courseCardsContainer.appendChild(courseCard);
        });
      } else {
        courseCardsContainer.innerHTML = `<p>No courses available for ${selectedMajor}.</p>`;
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      courseCardsContainer.innerHTML = `<p>Error loading courses.</p>`;
    }
  }

  // Apply saved heart state on general courses or other pages
  loadHeartStateOnPageLoad();
});

document.addEventListener("DOMContentLoaded", async () => {
  const majorSelect = document.getElementById("major");
  const courseContainer = document.getElementById("course-container");
  const courseSelect = document.getElementById("course");

  // General courses from the provided HTML
  const generalCourses = [
    "Phys101",
    "Chem101",
    "Math101",
    "MATH001",
    "MATH002",
    "ENG01",
    "ENG02",
    "ENG03",
    "ENG04",
    "PYP001",
    "PYP002",
    "PYP003",
    "PYP004",
    "PHYS101",
    "PHYS102",
    "CHEM101",
    "ICS104",
    "IAS111",
    "IAS121",
    "ENG101",
    "ENG102",
    "MATH103",
    "MATH208",
    "ISE291",
    "ENG214",
    "IAS322",
    "IAS321",
    "BUS200",
    "STAT319",
  ];

  try {
    // Fetch courses dynamically from the backend
    const response = await fetch("/courses");
    if (!response.ok) throw new Error("Failed to load courses data");

    const coursesData = await response.json();

    // Set to track already added majors to avoid duplicates
    const addedMajors = new Set();

    // Populate majorSelect dropdown with majors from coursesData
    Object.keys(coursesData).forEach((major) => {
      if (!addedMajors.has(major)) {
        const option = document.createElement("option");
        option.value = major;
        option.textContent = major.toUpperCase(); // Display major in uppercase
        majorSelect.appendChild(option);
        addedMajors.add(major);
      }
    });

    // Add an option for general courses
    if (!addedMajors.has("general-courses")) {
      const generalOption = document.createElement("option");
      generalOption.value = "general-courses";
      generalOption.textContent = "General Courses";
      majorSelect.appendChild(generalOption);
      addedMajors.add("general-courses");
    }

    // Event listener to populate courses dropdown based on selected major
    majorSelect?.addEventListener("change", () => {
      const selectedMajor = majorSelect.value;

      // Show or hide course dropdown
      if (selectedMajor) {
        courseContainer.style.display = "block";
        courseSelect.innerHTML =
          '<option value="" disabled selected>Choose Course</option>';

        // Load courses for the selected major
        if (selectedMajor === "general-courses") {
          // Populate general courses
          generalCourses.forEach((course) => {
            const option = document.createElement("option");
            option.value = course;
            option.textContent = course;
            courseSelect.appendChild(option);
          });
        } else if (coursesData[selectedMajor]) {
          // Populate major-specific courses
          coursesData[selectedMajor].forEach((course) => {
            const option = document.createElement("option");
            option.value = course.id || course.name;
            option.textContent = course.name || course.id; // Adjust based on your courses.json structure
            courseSelect.appendChild(option);
          });
        }
      }
    });
  } catch (error) {
    console.error("Error loading courses:", error);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const fileUploadLabel = document.querySelector(".file-upload label");
  const uploadIcon = document.querySelector(".upload-icon");

  // Listen for file selection
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const fileName = fileInput.files[0].name;
      fileUploadLabel.textContent = fileName; // Display the file name
      fileUploadLabel.style.color = "green"; // Optional: Change color to indicate success
      uploadIcon.style.display = "none"; // Hide the upload icon
    } else {
      fileUploadLabel.innerHTML =
        '<img src="./arrow.png" alt="Upload Icon" class="upload-icon">'; // Reset label
      uploadIcon.style.display = "block"; // Show the upload icon
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Check if the current page is file_list.html
  const fileListPage = document.getElementById("file-list-title");
  if (fileListPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get("course")?.toLowerCase() || ""; // Normalize course to lowercase
    const fileType = urlParams.get("type")?.toLowerCase() || ""; // Normalize fileType to lowercase

    const fileListTitle = document.getElementById("file-list-title");
    const fileList = document.getElementById("file-list");

    // Capitalize the first letter of each word for display purposes
    const capitalize = (str) =>
      str
        ?.split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // Set the title
    fileListTitle.textContent = `${capitalize(fileType)} for ${capitalize(
      course
    )}`;

    // Fetch files from the server
    fetch(`/files?course=${course}&fileType=${fileType}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch files.");
        }
        return response.json();
      })
      .then((files) => {
        if (files.length === 0) {
          fileList.innerHTML = `<li>No files available for ${capitalize(
            fileType
          )}.</li>`;
        } else {
          files.forEach((file) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<a href="/files/${file.id}" target="_blank">${file.originalName}</a>`;
            fileList.appendChild(listItem);
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching files:", error);
        fileList.innerHTML = `<li>Failed to load files.</li>`;
      });
  }

  // Handle anchor clicks from course cards
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("hover-link")) {
      e.preventDefault();
      const course = e.target.closest(".card")?.dataset.id?.toLowerCase() || ""; // Normalize to lowercase
      const fileType =
        e.target.textContent?.toLowerCase().replace(" ", "-") || ""; // Normalize fileType

      // Navigate to file_list.html with query params
      if (course && fileType) {
        window.location.href = `/file-list?course=${course}&type=${fileType}`;
      } else {
        console.error("Invalid course or fileType.");
      }
    }
  });
});

// Save submitted files in localStorage
document.addEventListener("DOMContentLoaded", () => {
  const addFileForm = document.getElementById("add-file-form");
  const fileInput = document.getElementById("file-input");
  const fileTypeSelect = document.getElementById("file-type");
  const courseSelect = document.getElementById("course");

  addFileForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const fileType = fileTypeSelect.value;
    const course = courseSelect.value;

    if (!file || !fileType || !course) {
      alert("Please select a file, file type, and course.");
      return;
    }

    const fileName = file.name;

    // Retrieve existing files from localStorage
    const uploadedFiles =
      JSON.parse(localStorage.getItem("uploaded-files")) || {};

    // Organize files by course and fileType
    if (!uploadedFiles[course]) {
      uploadedFiles[course] = {};
    }
    if (!uploadedFiles[course][fileType]) {
      uploadedFiles[course][fileType] = [];
    }

    // Add the new file
    uploadedFiles[course][fileType].push(fileName);

    // Save back to localStorage
    localStorage.setItem("uploaded-files", JSON.stringify(uploadedFiles));

    alert(`File "${fileName}" uploaded successfully!`);
    fileInput.value = "";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const fileTypeSelect = document.getElementById("file-type");
  const majorSelect = document.getElementById("major");
  const courseSelect = document.getElementById("course");

  const uploadButton = document.querySelector(".btn");

  uploadButton.addEventListener("click", async (event) => {
    event.preventDefault();

    // Ensure all required fields are filled
    if (!fileInput.files.length) {
      alert("Please select a file!");
      return;
    }
    if (!fileTypeSelect.value || !majorSelect.value || !courseSelect.value) {
      alert("Please fill in all the required fields!");
      return;
    }

    // Prepare the form data
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("fileType", fileTypeSelect.value);
    formData.append("major", majorSelect.value);
    formData.append("course", courseSelect.value);

    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      // Send the file using fetch
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        console.log("File uploaded:", data.filePath);

        // Reset fields after successful upload
        fileInput.value = "";
        fileTypeSelect.value = "";
        majorSelect.value = "";
        courseSelect.value = "";
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Something went wrong while uploading the file.");
    }
  });
});
