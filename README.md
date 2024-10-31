# Introduction

This plugin is a fork of the Strapi Plugin Email Designer. It is used to create a single-one-page PDF using drag-and-drop.

[Strapi-plugin-email-designer](https://www.npmjs.com/package/strapi-plugin-email-designer/v/1.1.2)


## Requirement :
You need a node version +18 and a Strapi v5 project

## Version

The plugin structure from strapi v5 is way different from the v4, so this plugin is only compatible with v5 use the [Strapi-plugin-email-designer](https://www.npmjs.com/package/strapi-plugin-email-designer/v/1.1.2) for v4



## Installation

Install the strapi-pdf-designer with node :  
```javascript
npm install strapi-pdf-designer-5@latest
```

Make sure to enable it in the plugin file.

```javascript
return {
    'pdf-designer-5': {
      enabled: true,
    },
}
```

## Configuration

By default, Strapi has strict security settings. You need to add the following to your config/middleware.ts file:

```ts
{
  name: "strapi::security",
  config: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "editor.unlayer.com"],
        "frame-src": ["'self'", "editor.unlayer.com"],
        upgradeInsecureRequests: null,
      },
    },
  },
}
```

## Usage
First, design your template on the plugin page in your Strapi Panel Admin.

Then call your plugin to generate your pdf :

```javascript
try {
   await strapi
    .plugin('pdf-designer-5')
    .service('pdf')
    .generatePdf(
      {
       templateReferenceId: 1
      },
)
```

If you want to put some data in your pdf, you can do it by adding in your design : {=data.exemple}

Then you can specify your data in the call plugin : 
```javascript
const pdf = await strapi.plugin('pdf-designer-5').service('pdf').generatePdf(
                { templateReferenceId: 1 },
                {
                  data: {
                     exemple: 'Test'
                   }
                },
            )

```

The plugin return a Buffer in base64.
## License

[MIT Licence](https://github.com/SomeDevelopper/strapi-pdf-designer/blob/main/LICENSE.md) and [Strapi solution](https://strapi.io)
