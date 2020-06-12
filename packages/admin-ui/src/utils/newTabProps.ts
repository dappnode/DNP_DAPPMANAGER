// Props to be passed to a JSX <a> element to open a new tab
// The purpose of this utility is to centralize this props.
// To disable the newTab openning for certain <a> from the whole project, edit this file
//
// It converts:
//   <a href={url} rel="noopener noreferrer" target="_blank">
// Into:
//   <a href={url} {...newTabProps}>

export default { rel: "noopener noreferrer", target: "_blank" };
