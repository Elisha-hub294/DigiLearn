declare module "nodemailer" {
  const nodemailer: {
    createTransport: (options: {
      service: string;
      auth: { user: string; pass: string };
    }) => {
      sendMail: (options: {
        from: string;
        to: string;
        subject: string;
        text: string;
      }) => Promise<unknown>;
    };
  };

  export default nodemailer;
}
