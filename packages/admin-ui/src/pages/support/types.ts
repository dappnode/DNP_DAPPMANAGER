export type DiagnoseResult = {
  loading?: boolean;
  ok?: boolean;
  msg: string;
  solutions?: string[];
  link?: { linkMsg: string; linkUrl: string };
};
