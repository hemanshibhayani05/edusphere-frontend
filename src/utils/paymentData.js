// Utility to fetch real & formatted payment/enrollment data for the Admin Dashboard
export const getAdminPaymentsAndEnrollments = () => {
  let list = [];

  // Read primary enrollments array
  try {
    const saved = localStorage.getItem("edusphere_enrollments");
    if (saved) {
      list = JSON.parse(saved);
    }
  } catch (_) {}

  // Read fallback single enrollment if not already in list
  try {
    const single = localStorage.getItem("enrollment");
    if (single) {
      const parsed = JSON.parse(single);
      if (!list.find((e) => e.paymentId === parsed.paymentId || e.courseId === parsed.courseId)) {
        list.push(parsed);
      }
    }
  } catch (_) {}

  const defaultDemoData = [
    {
      courseId: 1,
      courseTitle: "Complete React.js Developer Course",
      instructor: "Ananya Sharma",
      price: 2949,
      studentName: "Rahul Shah",
      studentEmail: "rahul@example.com",
      paymentId: "pay_UPI892A1F9",
      orderId: "order_DEMO88A12",
      paymentMethod: "UPI QR Scanner",
      paymentMethodDetails: "Scanned QR Code (edusphere@upi) - No PIN",
      enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      progress: 45,
      paid: true,
    },
    {
      courseId: 2,
      courseTitle: "Node.js & Express.js Backend Masterclass",
      instructor: "Ananya Sharma",
      price: 2713,
      studentName: "Neha Patel",
      studentEmail: "neha@example.com",
      paymentId: "pay_CARD773B2A",
      orderId: "order_DEMO99B34",
      paymentMethod: "Credit / Debit Card",
      paymentMethodDetails: "Visa ending in •••• 4111 (Neha Patel)",
      enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      progress: 70,
      paid: true,
    },
    {
      courseId: 4,
      courseTitle: "Full-Stack MERN Development",
      instructor: "Ananya Sharma",
      price: 4129,
      studentName: "Aarav Mehta",
      studentEmail: "aarav@example.com",
      paymentId: "pay_UPI334A99C",
      orderId: "order_DEMO11C56",
      paymentMethod: "UPI Direct",
      paymentMethodDetails: "UPI ID: aarav@okaxis",
      enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      progress: 20,
      paid: true,
    },
    {
      courseId: 3,
      courseTitle: "HTML, CSS & JavaScript Bootcamp",
      instructor: "Karan Verma",
      price: 1769,
      studentName: "Priya Sharma",
      studentEmail: "priya@example.com",
      paymentId: "pay_BANK552C88",
      orderId: "order_DEMO22D78",
      paymentMethod: "Net Banking",
      paymentMethodDetails: "Bank: State Bank of India",
      enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      progress: 100,
      paid: true,
    },
  ];

  if (list.length === 0) {
    return defaultDemoData;
  }

  const currentUser = JSON.parse(localStorage.getItem("edusphere_user") || "{}");
  const enrichedRealList = list.map((item) => ({
    ...item,
    studentName: item.studentName || currentUser.name || "Student Learner",
    studentEmail: item.studentEmail || currentUser.email || "student@edusphere.com",
    paymentMethod: item.paymentMethod || "UPI QR Scanner",
    paymentMethodDetails: item.paymentMethodDetails || "UPI Instant Payment (No PIN)",
  }));

  const realCourseIds = new Set(enrichedRealList.map((e) => e.courseId));
  const additionalDemo = defaultDemoData.filter((d) => !realCourseIds.has(d.courseId));

  return [...enrichedRealList, ...additionalDemo];
};
