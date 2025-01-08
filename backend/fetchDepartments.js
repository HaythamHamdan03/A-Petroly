const fetchDepartments = async () => {
    const response = await fetch(
      "https://banner9-registration.kfupm.edu.sa/StudentRegistrationSsb/ssb/classSearch/get_subject?searchTerm=&term=202410&offset=1&max=1000"
    );
    const departments = await response.json();
    console.log(departments);
  };
  fetchDepartments();
  