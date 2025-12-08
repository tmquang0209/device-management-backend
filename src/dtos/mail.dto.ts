export interface SendMailOptions {
  to: string;
  subject: string;
  data: Record<string, any>;
  template: string;
}
