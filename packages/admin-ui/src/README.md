# General app developer resources

## Folder structure

Inspired by https://medium.com/@alexmngn/how-to-better-organize-your-react-applications-2fd3ea1920f1

```
/src
  /components
    /Button
    /Notifications
      /components
        /ButtonDismiss
          /images
          /locales
          /specs
          /index.js
          /styles.scss
      /index.js
      /styles.scss

  /pages
    /Home
      /components
        /ButtonLike
      /services
        /processData
      /index.js
      /styles.scss
    /Sign
      /components
        /FormField
      /pages
        /Login
        /Register
          /locales
          /specs
          /index.js
          /styles.scss

  /services
    /api
    /geolocation
    /session
      /actions.js
      /index.js
      /reducer.js
    /users
      /actions.js
      /api.js
      /reducer.js

  index.js
  store.js
```
