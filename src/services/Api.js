import { courses } from "../data/mockData";

export const loginUser = async (data) => {
  return {
    user: {
      id: 1,
      name: data.role === "Admin" ? "Admin User" : "Student User",
      email: data.email,
      role: data.role,
    },
    token: "mock-token",
  };
};

export const registerUser = async (data) => {
  return {
    user: {
      id: Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    },
    token: "mock-token",
  };
};

export const logoutUser = async () => {
  return true;
};

export const getCourses = async () => {
  return courses;
};

export const getCourseById = async (id) => {
  return courses.find((course) => String(course.id || course._id) === String(id));
};

export const enrollCourse = async (courseId) => {
  return {
    success: true,
    courseId,
  };
};

export const getStudentCourses = async () => {
  return courses.slice(0, 3);
};

export const getStudents = async () => {
  return [];
};

export const addCourse = async (course) => {
  return course;
};

export const updateCourse = async (id, course) => {
  return {
    id,
    ...course,
  };
};

export const deleteCourse = async (id) => {
  return {
    success: true,
    id,
  };
};