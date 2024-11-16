const generateSuperAdminEmail = (adminId, username, email) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000/api/v1';
  const approveLink = `${baseUrl}/admin/approve/${adminId}`;
  const rejectLink = `${baseUrl}/admin/reject/${adminId}`;

  return {
    text: `A new admin request has been submitted.\nUsername: ${username}\nEmail: ${email}\n\nPlease review and approve or reject the request using the links below:\nApprove: ${approveLink}\nReject: ${rejectLink}`,
    html: `<p>A new admin request has been submitted.</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Please review and approve or reject the request:</p>
          <a href="${approveLink}">Approve Admin</a> |
          <a href="${rejectLink}">Reject Admin</a>`,
  };
};

export default generateSuperAdminEmail;