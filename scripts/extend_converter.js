const fs = require('fs');
const path = require('path');
const camelcase = require('camelcase');

const [node, script, folder, ...classNames] = process.argv;
for (const className of classNames) {
    const swagger = JSON.parse(
        fs.readFileSync(path.join(folder, `${className}-docs.json`))
    );
    const modified_swagger = fixRequestBodyNames(swagger);
    fs.writeFileSync(
        path.join(folder, `${className}-docs.json`),
        JSON.stringify(modified_swagger, null, 2)
    );
}

function camelCase(str) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
}

function fixRequestBodyNames(json_data) {
    for (const pathKey in json_data.paths) {
        const path = json_data.paths[pathKey];
        for (const methodKey in path) {
            const method = path[methodKey];
            const bodyParam = method.parameters.find(
                param => param.name === 'body'
            );

            if (bodyParam && bodyParam.schema && bodyParam.schema.$ref) {
                extractNameFromRefKey(bodyParam);
            } else if (
                bodyParam &&
                bodyParam.schema &&
                bodyParam.schema.description
            ) {
                extractNameFromDescription(bodyParam);
            }
        }
    }
    return json_data;
}

function extractNameFromRefKey(bodyParam) {
    // Extract value after '#/definitions/'
    const refValue = bodyParam.schema.$ref.replace('#/definitions/', '');

    // Convert the extracted value to camelCase
    const camelCaseName = camelcase(refValue);

    // Update the name field
    bodyParam.name = camelCaseName;
    return bodyParam;
}

function extractNameFromDescription(bodyParam) {
    const isArray = bodyParam.schema.type === 'array';
    let description = bodyParam.schema.description;
    if (isArray) {
        description = bodyParam.schema.description.replace('List of', '');
    }
    bodyParam.name = camelcase(description.toLowerCase());
    return bodyParam;
}
