module.exports = [
"[project]/nextra-docs/node_modules/nextra/dist/server/page-map/normalize.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizePageMap",
    ()=>normalizePageMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$schemas$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/schemas.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/utils.js [app-rsc] (ecmascript)");
;
;
;
function normalizePageMap(pageMap) {
    if (Array.isArray(pageMap)) {
        return sortFolder(pageMap.map((item)=>"children" in item ? normalizePageMap(item) : item));
    }
    return sortFolder(pageMap);
}
function titlize(item, meta) {
    const titleFromMeta = meta[item.name]?.title;
    if (titleFromMeta) return titleFromMeta;
    if ("frontMatter" in item && item.frontMatter) {
        const titleFromFrontMatter = item.frontMatter.sidebarTitle || item.frontMatter.title;
        if (titleFromFrontMatter) return titleFromFrontMatter;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pageTitleFromFilename"])(item.name);
}
function sortFolder(pageMap) {
    const newChildren = [];
    const isFolder = !Array.isArray(pageMap);
    const folder = isFolder ? {
        ...pageMap
    } : {
        children: pageMap
    };
    const meta = {};
    for (const item of folder.children){
        if (isFolder && "frontMatter" in item && item.frontMatter?.asIndexPage && item.route === folder.route) {
            folder.frontMatter = item.frontMatter;
        } else if ("children" in item) {
            newChildren.push(normalizePageMap(item));
        } else if ("data" in item) {
            for (const [key, titleOrObject] of Object.entries(item.data)){
                const { data, error } = __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$schemas$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["metaSchema"].safeParse(titleOrObject);
                if (error) {
                    throw __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].prettifyError(error);
                }
                if (key === "*") {
                    delete data.title;
                    delete data.href;
                }
                meta[key] = data;
            }
        } else {
            newChildren.push(item);
        }
    }
    const metaKeys = Object.keys(meta);
    const hasIndexKey = metaKeys.includes("index");
    const items = newChildren.sort((a, b)=>{
        const indexA = metaKeys.indexOf(a.name);
        const indexB = metaKeys.indexOf(b.name);
        if (!hasIndexKey) {
            if (b.name === "index") return 1;
            if (a.name === "index") return -1;
        }
        if (indexA === -1 && indexB === -1) return a.name < b.name ? -1 : 1;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    for (const [index, metaKey] of metaKeys.filter((key)=>key !== "*").entries()){
        const metaItem = meta[metaKey];
        const item = items.find((item2)=>item2.name === metaKey);
        if (metaItem.type === "menu" && item) {
            item.items = metaItem.items;
            const { children } = items.find((i)=>i.name === metaKey);
            for (const [key, value] of Object.entries(// @ts-expect-error fixme
            item.items)){
                if (!value.href && children.every((i)=>i.name !== key)) {
                    throw new Error(`Validation of "_meta" file has failed.
The field key "${metaKey}.items.${key}" in \`_meta\` file refers to a page that cannot be found, remove this key from "_meta" file.`);
                }
            }
        }
        if (item) continue;
        const isValid = metaItem.type === "separator" || metaItem.type === "menu" || metaItem.href;
        if (!isValid) {
            throw new Error(`Validation of "_meta" file has failed.
The field key "${metaKey}" in \`_meta\` file refers to a page that cannot be found, remove this key from "_meta" file.`);
        }
        const currentItem = items[index];
        if (currentItem?.name === metaKey) continue;
        items.splice(index, // index at which to start changing the array
        0, // remove zero items
        // @ts-expect-error fixme
        {
            name: metaKey,
            ...meta[metaKey]
        });
    }
    if (metaKeys.length) {
        items.unshift({
            data: meta
        });
    }
    const itemsWithTitle = items.map((item)=>{
        const isSeparator = "type" in item && item.type === "separator";
        if ("name" in item && !isSeparator) {
            return {
                ...item,
                title: titlize(item, meta)
            };
        }
        return item;
    });
    const result = isFolder ? {
        ...folder,
        title: titlize(folder, {}),
        children: itemsWithTitle
    } : itemsWithTitle;
    return result;
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/page-map/to-page-map.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "convertToPageMap",
    ()=>convertToPageMap
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/shared/lib/router/utils/app-paths.js [app-rsc] (ecmascript)");
;
;
function createNested(map, path2) {
    let current = map;
    for (const part of path2.split("/")){
        current[part] ||= {};
        current = current[part];
    }
}
const APP_DIR_SUFFIX_RE = /^(src\/)?app\//;
function convertToPageMap({ filePaths, basePath, locale }) {
    const pages = {};
    const metaFiles = {};
    const nestedMap = {};
    for (const filePath of filePaths){
        let { name, dir } = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].parse(filePath);
        const inAppDir = APP_DIR_SUFFIX_RE.test(filePath);
        if (inAppDir) {
            dir = dir.replace(/^(src\/)?app(\/|$)/, "");
        } else {
            let filePath2 = dir.replace(/^(src\/)?content(\/|$)/, "");
            if (locale) filePath2 = filePath2.replace(new RegExp(`^${locale}/?`), "");
            dir = [
                basePath,
                filePath2
            ].filter(Boolean).join("/");
        }
        if (name === "_meta") {
            const key = dir ? `${dir}/${name}` : name;
            metaFiles[key] = filePath;
        } else if (name !== "_meta.global") {
            const key = inAppDir ? // In Next.js we can organize routes without affecting the URL
            // https://nextjs.org/docs/app/building-your-application/routing/route-groups#organize-routes-without-affecting-the-url-path
            //
            // E.g. we have the following filepath:
            // app/posts/(with-comments)/aaron-swartz-a-programmable-web/()/page.mdx
            //
            // will be normalized to:
            // app/posts/aaron-swartz-a-programmable-web/page.mdx
            //
            // The `normalizeAppPath` function ensures a leading slash is present, so we slice it off.
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$router$2f$utils$2f$app$2d$paths$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizeAppPath"])(dir).slice(1) : [
                dir,
                name !== "index" && name
            ].filter(Boolean).join("/");
            pages[key] = filePath;
        }
    }
    for (const path2 of Object.keys(metaFiles)){
        createNested(nestedMap, path2);
    }
    for (const path2 of Object.keys(pages)){
        createNested(nestedMap, path2 && `${path2}/`);
    }
    function fillPageMap(obj, prefix) {
        return Object.entries(obj).map(([key, value])=>{
            const path2 = prefix && key ? `${prefix}/${key}` : prefix || key;
            if (key === "_meta") {
                const __metaPath = metaFiles[path2];
                if (!__metaPath) {
                    const o = JSON.stringify({
                        path: path2,
                        metaFiles
                    }, null, 2);
                    throw new Error(`Can't find "_meta" file for:
${o}`);
                }
                return {
                    __metaPath
                };
            }
            const item = {
                name: key || "index",
                route: `/${path2}`
            };
            const keys = Object.keys(value);
            const isFolder = keys.length > 1 || keys.length === 1 && keys[0] !== "";
            if (isFolder) {
                return {
                    ...item,
                    children: fillPageMap(value, path2)
                };
            }
            const __pagePath = pages[path2];
            if (!__pagePath) {
                const o = JSON.stringify({
                    path: path2,
                    mdxPages: pages
                }, null, 2);
                throw new Error(`Can't find "page" file for:
${o}`);
            }
            return {
                ...item,
                __pagePath
            };
        });
    }
    const pageMap = fillPageMap(nestedMap);
    const mdxPages = Object.fromEntries(Object.entries(pages).flatMap(([key, value])=>{
        if (basePath) key = key.replace(new RegExp(`^${basePath}/?`), "");
        value = value.replace(/^(src\/)?content\//, "");
        if (locale) value = value.replace(new RegExp(`^${locale}/`), "");
        if (APP_DIR_SUFFIX_RE.test(value)) {
            return [];
        }
        return [
            [
                key,
                value
            ]
        ];
    }));
    return {
        pageMap,
        mdxPages
    };
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/page-map/merge-meta-with-page-map.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mergeMetaWithPageMap",
    ()=>mergeMetaWithPageMap
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/utils.js [app-rsc] (ecmascript)");
;
;
function isFolder(value) {
    return !!value && typeof value === "object" && "items" in value && // @ts-expect-error -- fixme
    value.type !== "menu";
}
function normalizeMetaRecord(obj, map) {
    return Object.fromEntries(Object.entries(obj).map(([key, value])=>{
        let val;
        if (isFolder(value)) {
            const { items: _items, ...rest } = value;
            val = rest;
        } else {
            val = value;
        }
        return [
            key,
            map[key] ? val : val || (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pageTitleFromFilename"])(key)
        ];
    }));
}
function mergeMetaWithPageMap(pageMap, meta, shouldCheckIndividualMetaFilesUsage = false) {
    if ("children" in pageMap) {
        return {
            ...pageMap,
            children: mergeMetaWithPageMap(// @ts-expect-error -- fixme
            pageMap.children, meta, shouldCheckIndividualMetaFilesUsage)
        };
    }
    const result = pageMap.map(({ __pagePath, ...restParent })=>{
        if ("children" in restParent) {
            restParent.children = mergeMetaWithPageMap(restParent.children, // @ts-expect-error -- fixme
            meta[restParent.name]?.items || {});
            return restParent;
        }
        return restParent;
    });
    const normalizedMetaRecord = normalizeMetaRecord(meta, // @ts-expect-error -- fixme
    Object.fromEntries(result.map((key)=>[
            key.name,
            key.frontMatter
        ])));
    const metaRecord = result[0] && "data" in result[0] && result[0].data;
    if (metaRecord) {
        if (shouldCheckIndividualMetaFilesUsage) {
            const childRoute = result[1].route;
            const { dir } = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].parse(childRoute);
            const metaPath = `${dir.replace(/^\/$/, "")}/_meta`;
            throw new Error([
                "Merging an `_meta.global` file with a folder-specific `_meta` is unsupported.",
                `Move content of \`${metaPath}\` file into the \`_meta.global\` file`
            ].join("\n"));
        }
        ;
        result[0].data = {
            ...metaRecord,
            ...normalizedMetaRecord
        };
    } else {
        result.unshift({
            data: normalizedMetaRecord
        });
    }
    return result;
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/recma-plugins/recma-rewrite.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recmaRewrite",
    ()=>recmaRewrite
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/constants.js [app-rsc] (ecmascript)");
;
var Mdx = /* @__PURE__ */ ((Mdx2)=>{
    Mdx2["Wrapper"] = "MDXContent";
    Mdx2["Content"] = "_createMdxContent";
    return Mdx2;
})(Mdx || {});
const recmaRewrite = ({ isPageImport, isRemoteContent })=>(ast)=>{
        const hasMdxLayout = ast.body.some((node)=>node.type === "VariableDeclaration" && node.kind === "const" && node.declarations[0].id.type === "Identifier" && node.declarations[0].id.name === "MDXLayout");
        if (isRemoteContent) {
            if (hasMdxLayout) {
                return;
            }
            ast.body = ast.body.filter((node)=>node.type !== "FunctionDeclaration" || node.id.name !== "MDXContent" /* Wrapper */ );
            const returnStatement = ast.body.find((node)=>node.type === "ReturnStatement");
            const { properties } = returnStatement.argument;
            for (const node of properties){
                if (node.type === "Property" && node.key.type === "Identifier" && node.key.name === "default" && node.value.type === "Identifier" && node.value.name === "MDXContent" /* Wrapper */ ) {
                    node.value.name = "_createMdxContent" /* Content */ ;
                    break;
                }
            }
            return;
        }
        const defaultExport = ast.body.find((node)=>node.type === "ExportDefaultDeclaration");
        if (hasMdxLayout) {
            Object.assign(defaultExport, defaultExport.declaration);
            ast.body.unshift(HOC_IMPORT_AST);
            ast.body.push({
                type: "ExportDefaultDeclaration",
                declaration: createHocCallAst("MDXContent" /* Wrapper */ )
            });
            return;
        }
        if (isPageImport) {
            ast.body.unshift(HOC_IMPORT_AST);
            defaultExport.declaration = createHocCallAst("_createMdxContent" /* Content */ );
            return;
        }
        defaultExport.declaration = {
            type: "Identifier",
            name: "_createMdxContent" /* Content */ 
        };
    };
const HOC_IMPORT_AST = {
    type: "ImportDeclaration",
    source: {
        type: "Literal",
        value: "nextra/setup-page"
    },
    specifiers: [
        {
            type: "ImportSpecifier",
            imported: {
                type: "Identifier",
                name: "HOC_MDXWrapper"
            },
            local: {
                type: "Identifier",
                name: "HOC_MDXWrapper"
            }
        }
    ]
};
function createHocCallAst(componentName) {
    return {
        type: "CallExpression",
        callee: {
            type: "Identifier",
            name: "HOC_MDXWrapper"
        },
        optional: false,
        arguments: [
            {
                type: "Identifier",
                name: componentName
            },
            {
                type: "ObjectExpression",
                properties: [
                    {
                        ...__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_PROPERTY_PROPS"],
                        shorthand: true,
                        key: {
                            type: "Identifier",
                            name: "metadata"
                        },
                        value: {
                            type: "Identifier",
                            name: "metadata"
                        }
                    },
                    {
                        ...__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_PROPERTY_PROPS"],
                        shorthand: true,
                        key: {
                            type: "Identifier",
                            name: "toc"
                        },
                        value: {
                            type: "Identifier",
                            name: "toc"
                        }
                    },
                    {
                        ...__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_PROPERTY_PROPS"],
                        shorthand: true,
                        key: {
                            type: "Identifier",
                            name: "sourceCode"
                        },
                        value: {
                            type: "Identifier",
                            name: "sourceCode"
                        }
                    }
                ]
            }
        ]
    };
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_REHYPE_PRETTY_CODE_OPTIONS",
    ()=>DEFAULT_REHYPE_PRETTY_CODE_OPTIONS,
    "rehypeAttachCodeMeta",
    ()=>rehypeAttachCodeMeta,
    "rehypeParseCodeMeta",
    ()=>rehypeParseCodeMeta
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$shiki$2f$dist$2f$langs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/shiki/dist/langs.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$shiki$2f$dist$2f$bundle$2d$full$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/shiki/dist/bundle-full.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit-parents/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
;
;
const CODE_BLOCK_FILENAME_RE = /filename="([^"]+)"/;
const DEFAULT_REHYPE_PRETTY_CODE_OPTIONS = {
    keepBackground: false,
    grid: false,
    onVisitLine (node) {
        if (node.children.length === 0) {
            node.children.push({
                type: "text",
                value: " "
            });
        }
        delete node.properties["data-line"];
    },
    theme: {
        light: "github-light",
        dark: "github-dark"
    },
    defaultLang: {
        block: "plaintext"
    },
    filterMetaString: (meta)=>meta.replace(CODE_BLOCK_FILENAME_RE, ""),
    getHighlighter (opts) {
        const langs = Object.keys(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$shiki$2f$dist$2f$langs$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["bundledLanguages"]).filter((l)=>l !== "mermaid");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$shiki$2f$dist$2f$bundle$2d$full$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createHighlighter"])({
            ...opts,
            // Without `getHighlighter` option ```mdx lang isn't highlighted
            langs
        });
    }
};
const rehypeParseCodeMeta = ({ defaultShowCopyCode })=>(ast)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, {
            tagName: "pre"
        }, (node)=>{
            const [codeEl] = node.children;
            const { meta = "" } = codeEl.data || {};
            node.__filename = meta.match(CODE_BLOCK_FILENAME_RE)?.[1];
            node.properties["data-filename"] = node.__filename;
            node.__hasWordWrap = !meta.includes("word-wrap=false");
            if (node.__hasWordWrap) {
                node.properties["data-word-wrap"] = "";
            }
            node.__hasCopyCode = meta ? defaultShowCopyCode && !/( |^)copy=false($| )/.test(meta) || /( |^)copy($| )/.test(meta) : defaultShowCopyCode;
            if (node.__hasCopyCode) {
                node.properties["data-copy"] = "";
            }
        });
    };
const rehypeAttachCodeMeta = ({ search })=>{
    const parseCodeblocks = typeof search === "object" ? search.codeblocks : search;
    return (ast)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, [
            {
                tagName: "figure"
            },
            {
                tagName: "span"
            }
        ], (node)=>{
            const isRehypePrettyCode = "data-rehype-pretty-code-figure" in node.properties;
            if (!isRehypePrettyCode) return;
            const preEl = Object.assign(node, node.children[0]);
            delete preEl.properties["data-theme"];
            if (preEl.tagName === "pre") {
                const codeEl = preEl.children[0];
                delete codeEl.properties["data-theme"];
                delete codeEl.properties["data-language"];
                if (preEl.__hasWordWrap) {
                    preEl.properties["data-word-wrap"] = "";
                }
                if (preEl.__filename) {
                    preEl.properties["data-filename"] = preEl.__filename;
                }
                if (preEl.__hasCopyCode) {
                    preEl.properties["data-copy"] = "";
                }
                if (!parseCodeblocks) {
                    preEl.properties["data-pagefind-ignore"] = "all";
                }
                return __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SKIP"];
            }
            delete node.children[0].properties.className;
        });
    };
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype-better-react-mathjax.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "rehypeBetterReactMathjax",
    ()=>rehypeBetterReactMathjax
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$estree$2d$util$2d$value$2d$to$2d$estree$2f$dist$2f$estree$2d$util$2d$value$2d$to$2d$estree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/estree-util-value-to-estree/dist/estree-util-value-to-estree.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
;
;
const MATHJAX_IMPORTS = {
    type: "mdxjsEsm",
    data: {
        estree: {
            body: [
                {
                    type: "ImportDeclaration",
                    source: {
                        type: "Literal",
                        value: "nextra/components"
                    },
                    specifiers: [
                        "MathJax",
                        "MathJaxContext"
                    ].map((name)=>({
                            type: "ImportSpecifier",
                            imported: {
                                type: "Identifier",
                                name
                            },
                            local: {
                                type: "Identifier",
                                name
                            }
                        }))
                }
            ]
        }
    }
};
function wrapInMathJaxContext(children, { config, src }) {
    const attributes = [];
    if (src) {
        attributes.push({
            type: "mdxJsxAttribute",
            name: "src",
            value: src
        });
    }
    if (config && Object.keys(config).length) {
        attributes.push({
            type: "mdxJsxAttribute",
            name: "config",
            value: {
                type: "mdxJsxAttributeValueExpression",
                value: "",
                data: {
                    estree: {
                        type: "Program",
                        sourceType: "module",
                        body: [
                            {
                                type: "ExpressionStatement",
                                expression: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$estree$2d$util$2d$value$2d$to$2d$estree$2f$dist$2f$estree$2d$util$2d$value$2d$to$2d$estree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["valueToEstree"])(config)
                            }
                        ]
                    }
                }
            }
        });
    }
    return {
        type: "mdxJsxFlowElement",
        name: "MathJaxContext",
        attributes,
        children
    };
}
function wrapInBraces(source, mathInline, options) {
    const { inlineMath, displayMath } = options.config?.tex || {};
    const inlineBraces = inlineMath?.[0] || [
        String.raw`\(`,
        String.raw`\)`
    ];
    const displayBraces = displayMath?.[0] || [
        String.raw`\[`,
        String.raw`\]`
    ];
    const [before, after] = mathInline ? inlineBraces : displayBraces;
    return `${before}${source}${after}`;
}
const rehypeBetterReactMathjax = (options = {}, isRemoteContent)=>(ast)=>{
        let hasMathJax = false;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, {
            tagName: "code"
        }, (node, _index, parent)=>{
            const classes = Array.isArray(node.properties.className) ? node.properties.className : [];
            const hasMathLanguage = classes.includes("language-math");
            if (!hasMathLanguage) return;
            const isInlineMath = classes.includes("math-inline");
            const [{ value }] = node.children;
            const bracketedValue = wrapInBraces(value, isInlineMath, options);
            const mathJaxNode = {
                type: "element",
                tagName: "MathJax",
                children: [
                    {
                        type: "text",
                        value: bracketedValue
                    }
                ],
                properties: isInlineMath ? {
                    inline: true
                } : {}
            };
            Object.assign(isInlineMath ? node : parent, mathJaxNode);
            hasMathJax = true;
        });
        if (!hasMathJax) return;
        const mdxjsEsmNodes = [];
        const rest = [];
        for (const child of ast.children){
            if (child.type === "mdxjsEsm") {
                mdxjsEsmNodes.push(child);
            } else {
                rest.push(child);
            }
        }
        ast.children = [
            ...mdxjsEsmNodes,
            ...isRemoteContent ? [] : [
                MATHJAX_IMPORTS
            ],
            // Wrap everything in a `<MathJaxContext>` component.
            wrapInMathJaxContext(rest, options)
        ];
    };
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype-extract-toc-content.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "rehypeExtractTocContent",
    ()=>rehypeExtractTocContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$hast$2d$util$2d$to$2d$estree$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/hast-util-to-estree/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit-parents/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/utils.js [app-rsc] (ecmascript)");
;
;
;
const TOC_HEADING_RE = /^h[2-6]$/;
const transformer = (ast, file)=>{
    const TocMap = {};
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, "element", (node, _index, parent)=>{
        if (!TOC_HEADING_RE.test(node.tagName)) return;
        if (parent && "properties" in parent && parent.properties.dataFootnotes) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SKIP"];
        }
        const { id } = node.properties;
        TocMap[id] = node;
    });
    const hasPartialMDX = file.data.toc.some((name)=>typeof name === "string");
    const elements = file.data.toc.map((name, index)=>{
        if (typeof name === "string") {
            return {
                type: "SpreadElement",
                argument: {
                    type: "Identifier",
                    name
                }
            };
        }
        const node = TocMap[name.id];
        const isTextOnly = node.children.every((child)=>child.type === "text");
        const result = isTextOnly ? node.children.map((n)=>n.value).join("") : // @ts-expect-error -- fixme
        Object.assign((0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$hast$2d$util$2d$to$2d$estree$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toEstree"])(node).body[0].expression, {
            type: "JSXFragment",
            openingFragment: {
                type: "JSXOpeningFragment"
            },
            closingFragment: {
                type: "JSXClosingFragment"
            }
        });
        if (!hasPartialMDX) {
            Object.assign(node, {
                type: "mdxJsxFlowElement",
                name: node.tagName,
                attributes: [
                    {
                        type: "mdxJsxAttribute",
                        name: "id",
                        value: createComputedKey("mdxJsxAttributeValueExpression", index, "id")
                    }
                ],
                children: [
                    createComputedKey("mdxFlowExpression", index, "value")
                ]
            });
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAstObject"])({
            value: result,
            id: node.properties.id,
            depth: Number(node.tagName[1])
        });
    });
    ast.children.push({
        type: "mdxjsEsm",
        data: {
            estree: {
                body: [
                    {
                        // TOC links must be inside a function, in our case inside useTOC, so
                        // mdx components will be injected for `<a>` or `<code>` tags inside headings
                        type: "FunctionDeclaration",
                        id: {
                            type: "Identifier",
                            name: "useTOC"
                        },
                        params: [
                            {
                                type: "Identifier",
                                name: "props"
                            }
                        ],
                        body: {
                            type: "BlockStatement",
                            body: [
                                {
                                    type: "ReturnStatement",
                                    argument: {
                                        type: "ArrayExpression",
                                        elements
                                    }
                                }
                            ]
                        }
                    },
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAstExportConst"])("toc", {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: "useTOC"
                        },
                        // https://github.com/shuding/nextra/issues/3979
                        arguments: [
                            {
                                type: "ObjectExpression",
                                properties: []
                            }
                        ],
                        optional: false
                    })
                ]
            }
        }
    });
};
function createComputedKey(type, index, key) {
    return {
        type,
        data: {
            estree: {
                body: [
                    {
                        type: "ExpressionStatement",
                        expression: {
                            type: "MemberExpression",
                            property: {
                                type: "Identifier",
                                name: key
                            },
                            object: {
                                type: "MemberExpression",
                                object: {
                                    type: "Identifier",
                                    name: "toc"
                                },
                                property: {
                                    type: "Literal",
                                    value: index
                                },
                                computed: true
                            }
                        }
                    }
                ]
            }
        }
    };
}
const rehypeExtractTocContent = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype-twoslash-popup.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "rehypeTwoslashPopup",
    ()=>rehypeTwoslashPopup
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit-parents/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
;
const TWOSLASH_POPUP_IMPORT_AST = {
    type: "mdxjsEsm",
    data: {
        estree: {
            body: [
                {
                    type: "ImportDeclaration",
                    source: {
                        type: "Literal",
                        value: "nextra/components"
                    },
                    specifiers: [
                        {
                            type: "ImportSpecifier",
                            imported: {
                                type: "Identifier",
                                name: "Popup"
                            },
                            local: {
                                type: "Identifier",
                                name: "Popup"
                            }
                        }
                    ]
                }
            ]
        }
    }
};
const transformer = (ast)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, [
        {
            tagName: "popup"
        },
        {
            tagName: "popupbutton"
        },
        {
            tagName: "popuppanel"
        }
    ], (node)=>{
        const n = node;
        const tagName = {
            popup: "Popup",
            popupbutton: "Popup.Button",
            popuppanel: "Popup.Panel"
        }[n.tagName];
        n.tagName = tagName;
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, {
        tagName: "code"
    }, (node)=>{
        if (node.data?.meta === "twoslash") {
            ast.children.unshift(TWOSLASH_POPUP_IMPORT_AST);
            return __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EXIT"];
        }
    });
};
const rehypeTwoslashPopup = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-headings.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFlattenedValue",
    ()=>getFlattenedValue,
    "remarkHeadings",
    ()=>remarkHeadings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$github$2d$slugger$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/github-slugger/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$children$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit-children/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/constants.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/utils.js [app-rsc] (ecmascript)");
;
;
;
;
;
const getFlattenedValue = (node)=>node.children.map((child)=>"children" in child ? getFlattenedValue(child) : "value" in child ? child.value : "").join("");
const remarkHeadings = ({ exportName = "toc", isRemoteContent })=>{
    const headings = [];
    const slugger = new __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$github$2d$slugger$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]();
    return (ast, file)=>{
        const PartialComponentToHeadingsName = /* @__PURE__ */ Object.create(null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, [
            "heading",
            // push partial component's `toc` export name to headings list
            "mdxJsxFlowElement",
            // verify .md/.mdx exports and attach named `toc` export
            "mdxjsEsm"
        ], (node, index, parent)=>{
            if (node.type === "heading") {
                if (node.depth === 1) {
                    return;
                }
                node.data ||= {};
                const headingProps = node.data.hProperties ||= {};
                const value = getFlattenedValue(node);
                const id = slugger.slug(headingProps.id || value);
                headingProps.id = id;
                headings.push({
                    depth: node.depth,
                    value,
                    id
                });
                return;
            }
            const isTab = node.type === "mdxJsxFlowElement" && node.name === "Tabs.Tab";
            if (isTab) {
                const itemsAttr = parent?.type === "mdxJsxFlowElement" && parent.name === "Tabs" && parent.attributes.find((attr)=>attr.type === "mdxJsxAttribute" && attr.name === "items");
                if (!itemsAttr) return;
                const tabName = itemsAttr.value.data.estree.body[0].expression.elements.map((el)=>el.value)[index];
                const id = slugger.slug(tabName);
                node.children.unshift({
                    type: "mdxJsxFlowElement",
                    name: "h3",
                    data: {
                        _mdxExplicitJsx: true
                    },
                    children: [
                        {
                            type: "text",
                            value: tabName
                        }
                    ],
                    attributes: [
                        {
                            type: "mdxJsxAttribute",
                            name: "id",
                            value: id
                        },
                        {
                            type: "mdxJsxAttribute",
                            name: "style",
                            value: {
                                type: "mdxJsxAttributeValueExpression",
                                value: "",
                                data: {
                                    estree: {
                                        type: "Program",
                                        sourceType: "module",
                                        comments: [],
                                        body: [
                                            {
                                                type: "ExpressionStatement",
                                                expression: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAstObject"])({
                                                    visibility: "hidden",
                                                    width: 0,
                                                    height: 0
                                                })
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                });
            }
            const isDetails = node.type === "mdxJsxFlowElement" && node.name === "details";
            if (isDetails) {
                const visitor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$children$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["visitChildren"])((node2)=>{
                    const isSummary = node2.type === "mdxJsxTextElement" && node2.name === "summary";
                    if (isSummary) {
                        const value = getFlattenedValue(node2);
                        const id = slugger.slug(value);
                        node2.attributes.push({
                            type: "mdxJsxAttribute",
                            name: "id",
                            value: id
                        });
                    } else if ("children" in node2) {
                        visitor(node2);
                    }
                });
                visitor(node);
            }
            if (isRemoteContent) {} else if (node.type === "mdxjsEsm") {
                for (const child of node.data.estree.body){
                    if (child.type !== "ImportDeclaration") continue;
                    const importPath = child.source.value;
                    const isMdxImport = __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MARKDOWN_EXTENSION_RE"].test(importPath);
                    if (!isMdxImport) continue;
                    const componentName = child.specifiers.find((o)=>o.type === "ImportDefaultSpecifier")?.local.name;
                    if (!componentName) continue;
                    const { length } = Object.keys(PartialComponentToHeadingsName);
                    const exportAsName = `${exportName}${length}`;
                    PartialComponentToHeadingsName[componentName] = exportAsName;
                    child.specifiers.push({
                        type: "ImportSpecifier",
                        imported: {
                            type: "Identifier",
                            name: exportName
                        },
                        local: {
                            type: "Identifier",
                            name: exportAsName
                        }
                    });
                }
            } else {
                const headingsName = PartialComponentToHeadingsName[node.name];
                if (headingsName) {
                    headings.push(headingsName);
                }
            }
        });
        file.data.toc = headings;
    };
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-title.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFrontMatterASTObject",
    ()=>getFrontMatterASTObject,
    "isExportNode",
    ()=>isExportNode,
    "remarkMdxTitle",
    ()=>remarkMdxTitle
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit-parents/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$headings$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-headings.js [app-rsc] (ecmascript)");
;
;
;
;
function getFrontMatterASTObject(node) {
    const [n] = node.data.estree.body;
    return n.declaration.declarations[0].init.properties;
}
function isExportNode(node, varName) {
    if (node.type !== "mdxjsEsm") return false;
    const n = node.data.estree.body[0];
    if (n.type !== "ExportNamedDeclaration") return false;
    const name = n.declaration?.declarations?.[0].id.name;
    if (!name) return false;
    return name === varName;
}
const transformer = (ast, file)=>{
    let title = "";
    const frontMatterNode = ast.children.find((node)=>isExportNode(node, "metadata"));
    for (const { key, value } of getFrontMatterASTObject(frontMatterNode)){
        if (key.type === "Literal" && key.value === "title") {
            title = value.value;
            break;
        }
        if (key.type === "Identifier" && key.name === "title") {
            title = value.value;
            break;
        }
    }
    if (!title) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, {
            type: "heading",
            depth: 1
        }, (node)=>{
            title = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$headings$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFlattenedValue"])(node);
            return __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2d$parents$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EXIT"];
        });
        if (!title) {
            const [filePath] = file.history;
            if (filePath) {
                title = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pageTitleFromFilename"])(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].parse(filePath).name);
            }
        }
        if (title) {
            file.data.title = title;
        }
    }
};
const remarkMdxTitle = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-assign-frontmatter.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkAssignFrontMatter",
    ()=>remarkAssignFrontMatter
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$estree$2d$util$2d$value$2d$to$2d$estree$2f$dist$2f$estree$2d$util$2d$value$2d$to$2d$estree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/estree-util-value-to-estree/dist/estree-util-value-to-estree.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$slash$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/slash/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/constants.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-title.js [app-rsc] (ecmascript)");
;
;
;
;
;
const remarkAssignFrontMatter = ({ lastCommitTime })=>(ast, file)=>{
        const frontMatterNode = ast.children.find((node)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isExportNode"])(node, "metadata"));
        const frontMatter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFrontMatterASTObject"])(frontMatterNode);
        const [filePath] = file.history;
        const { readingTime, title } = file.data;
        const { properties } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$estree$2d$util$2d$value$2d$to$2d$estree$2f$dist$2f$estree$2d$util$2d$value$2d$to$2d$estree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["valueToEstree"])({
            ...title && {
                title
            },
            // File path can be undefined (e.g. dynamic mdx without filePath provided to processor)
            ...filePath && {
                filePath: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$slash$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].relative(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CWD"], filePath))
            },
            ...readingTime && {
                readingTime
            },
            ...lastCommitTime && {
                timestamp: lastCommitTime
            }
        });
        frontMatter.push(...properties);
    };
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-custom-heading-id.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkCustomHeadingId",
    ()=>remarkCustomHeadingId
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
;
const transformer = (ast)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, "heading", (node)=>{
        const lastChild = node.children.at(-1);
        if (lastChild?.type !== "text") return;
        const heading = lastChild.value;
        const matched = heading.match(/\s*\[#([^]+?)]\s*$/);
        if (!matched) return;
        node.data ||= {};
        const headingProps = node.data.hProperties ||= {};
        headingProps.id = matched[1];
        lastChild.value = heading.slice(0, matched.index);
    });
};
const remarkCustomHeadingId = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-export-source-code.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkExportSourceCode",
    ()=>remarkExportSourceCode
]);
const remarkExportSourceCode = ()=>(ast, file)=>{
        ast.children.push({
            type: "mdxjsEsm",
            value: "",
            data: {
                estree: {
                    type: "Program",
                    sourceType: "module",
                    body: [
                        {
                            type: "ExportNamedDeclaration",
                            specifiers: [],
                            declaration: {
                                type: "VariableDeclaration",
                                kind: "const",
                                declarations: [
                                    {
                                        type: "VariableDeclarator",
                                        id: {
                                            type: "Identifier",
                                            name: "sourceCode"
                                        },
                                        init: {
                                            type: "Literal",
                                            value: String(file.value).trim()
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        });
    };
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-link-rewrite.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkLinkRewrite",
    ()=>remarkLinkRewrite
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/constants.js [app-rsc] (ecmascript)");
;
;
const remarkLinkRewrite = ({ pattern, replace, excludeExternalLinks })=>(ast)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, "link", (node)=>{
            if (!excludeExternalLinks || !__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EXTERNAL_URL_RE"].test(node.url)) {
                node.url = node.url.replace(pattern, replace);
            }
        });
    };
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-disable-explicit-jsx.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkMdxDisableExplicitJsx",
    ()=>remarkMdxDisableExplicitJsx
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
;
const remarkMdxDisableExplicitJsx = ({ whiteList })=>(ast)=>{
        const test = whiteList.map((name)=>({
                name
            }));
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, test, (node)=>{
            delete node.data._mdxExplicitJsx;
        });
    };
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-frontmatter.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkMdxFrontMatter",
    ()=>remarkMdxFrontMatter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$estree$2d$util$2d$value$2d$to$2d$estree$2f$dist$2f$estree$2d$util$2d$value$2d$to$2d$estree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/estree-util-value-to-estree/dist/estree-util-value-to-estree.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$yaml$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/yaml/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-title.js [app-rsc] (ecmascript)");
;
;
;
;
function createNode(data) {
    return {
        type: "mdxjsEsm",
        data: {
            estree: {
                body: [
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createAstExportConst"])("metadata", (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$estree$2d$util$2d$value$2d$to$2d$estree$2f$dist$2f$estree$2d$util$2d$value$2d$to$2d$estree$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["valueToEstree"])(data))
                ]
            }
        }
    };
}
const transformer = (ast)=>{
    const yamlNodeIndex = ast.children.findIndex((node)=>node.type === "yaml");
    const esmNodeIndex = ast.children.findIndex((node)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isExportNode"])(node, "metadata"));
    const hasYaml = yamlNodeIndex !== -1;
    const hasEsm = esmNodeIndex !== -1;
    if (hasYaml) {
        if (hasEsm) {
            throw new Error("Both YAML front matter and `metadata` aren't supported. Keep only 1.");
        }
        const node = ast.children[yamlNodeIndex];
        ast.children[yamlNodeIndex] = createNode((0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$yaml$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(node.value) ?? {});
    } else if (!hasEsm) {
        ast.children.unshift(createNode({}));
    }
};
const remarkMdxFrontMatter = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-remove-imports.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkRemoveImports",
    ()=>remarkRemoveImports
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$remove$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-remove/lib/index.js [app-rsc] (ecmascript)");
;
const transformer = (ast)=>{
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$remove$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remove"])(ast, (node)=>node.type === "mdxjsEsm" && // @ts-expect-error -- fixme
        node.data.estree.body[0].type === "ImportDeclaration");
};
const remarkRemoveImports = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-static-image.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "remarkStaticImage",
    ()=>remarkStaticImage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/unist-util-visit/lib/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/constants.js [app-rsc] (ecmascript)");
;
;
;
const VALID_BLUR_EXT = [
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
    ".jpg"
];
const VARIABLE_PREFIX = "__img";
const transformer = (ast)=>{
    const definitionNodes = [];
    const imageImports = /* @__PURE__ */ new Set();
    const imageNodes = [];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, "definition", (node)=>{
        definitionNodes.push(node);
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$unist$2d$util$2d$visit$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["visit"])(ast, [
        "image",
        "imageReference"
    ], (_node)=>{
        const node = _node;
        let url = decodeURI(node.type === "image" ? node.url : definitionNodes.find((definition)=>definition.identifier === node.identifier)?.url ?? "");
        if (!url) {
            return;
        }
        if (__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EXTERNAL_URL_RE"].test(url)) {
            return;
        }
        if (url.startsWith("/")) {
            url = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].posix.join("private-next-root-dir", "public", url);
        }
        imageImports.add(url);
        node.url = url;
        imageNodes.push(node);
    });
    const imageUrls = [
        ...imageImports
    ];
    for (const node of imageNodes){
        const { url } = node;
        const imageIndex = imageUrls.indexOf(url);
        const variableName = `${VARIABLE_PREFIX}${imageIndex}`;
        const hasBlur = VALID_BLUR_EXT.some((ext)=>url.endsWith(ext));
        Object.assign(node, {
            type: "mdxJsxFlowElement",
            name: "img",
            attributes: [
                // do not render empty alt in html markup
                node.alt && {
                    type: "mdxJsxAttribute",
                    name: "alt",
                    value: node.alt
                },
                hasBlur && {
                    type: "mdxJsxAttribute",
                    name: "placeholder",
                    value: "blur"
                },
                {
                    type: "mdxJsxAttribute",
                    name: "src",
                    value: {
                        type: "mdxJsxAttributeValueExpression",
                        value: variableName,
                        data: {
                            estree: {
                                body: [
                                    {
                                        type: "ExpressionStatement",
                                        expression: {
                                            type: "Identifier",
                                            name: variableName
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ].filter((v)=>!!v)
        });
    }
    if (imageUrls.length) {
        ast.children.unshift(...imageUrls.map((imageUrl, index)=>({
                type: "mdxjsEsm",
                data: {
                    estree: {
                        body: [
                            {
                                type: "ImportDeclaration",
                                source: {
                                    type: "Literal",
                                    value: imageUrl
                                },
                                specifiers: [
                                    {
                                        type: "ImportDefaultSpecifier",
                                        local: {
                                            type: "Identifier",
                                            name: `${VARIABLE_PREFIX}${index}`
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            })));
    }
};
const remarkStaticImage = ()=>transformer;
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/compile.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileMdx",
    ()=>compileMdx
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f40$mdx$2d$js$2f$mdx$2f$lib$2f$core$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/@mdx-js/mdx/lib/core.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f40$theguild$2f$remark$2d$mermaid$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/@theguild/remark-mermaid/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f40$theguild$2f$remark$2d$npm2yarn$2f$dist$2f$plugin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/@theguild/remark-npm2yarn/dist/plugin.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$katex$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/rehype-katex/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$pretty$2d$code$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/rehype-pretty-code/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$raw$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/rehype-raw/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$frontmatter$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/remark-frontmatter/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$gfm$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/remark-gfm/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$math$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/remark-math/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$reading$2d$time$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/remark-reading-time/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$smartypants$2f$dist$2f$plugin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/remark-smartypants/dist/plugin.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/constants.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$recma$2d$plugins$2f$recma$2d$rewrite$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/recma-plugins/recma-rewrite.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2d$better$2d$react$2d$mathjax$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype-better-react-mathjax.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2d$extract$2d$toc$2d$content$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype-extract-toc-content.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2d$twoslash$2d$popup$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/rehype-plugins/rehype-twoslash-popup.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$assign$2d$frontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-assign-frontmatter.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$custom$2d$heading$2d$id$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-custom-heading-id.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$export$2d$source$2d$code$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-export-source-code.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$headings$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-headings.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$link$2d$rewrite$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-link-rewrite.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$disable$2d$explicit$2d$jsx$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-disable-explicit-jsx.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$frontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-frontmatter.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-mdx-title.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$remove$2d$imports$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-remove-imports.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$static$2d$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/remark-plugins/remark-static-image.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const cachedCompilerForFormat = /* @__PURE__ */ Object.create(null);
async function compileMdx(rawMdx, { staticImage, search, readingTime, latex, codeHighlight, defaultShowCopyCode, mdxOptions = {}, filePath = "", useCachedCompiler, isPageImport = false, whiteListTagsStyling = [], lastCommitTime } = {}) {
    const { jsx = false, format: _format = "mdx", outputFormat = "function-body", remarkPlugins, rehypePlugins, recmaPlugins, rehypePrettyCodeOptions, providerImportSource = "next-mdx-import-source-file" } = mdxOptions;
    const format = _format === "detect" ? filePath.endsWith(".mdx") ? "mdx" : "md" : _format;
    const fileCompatible = filePath ? {
        value: rawMdx,
        path: filePath
    } : rawMdx;
    const isRemoteContent = outputFormat === "function-body";
    const compiler = !useCachedCompiler || isRemoteContent ? createCompiler() : cachedCompilerForFormat[`${format}:${isPageImport}`] ||= createCompiler();
    const processor = compiler();
    try {
        const vFile = await processor.process(fileCompatible);
        const rawJs = vFile.value.replaceAll("__esModule", String.raw`_\_esModule`);
        return rawJs;
    } catch (error) {
        console.error(`[nextra] Error compiling ${filePath}.`);
        throw error;
    }
    function createCompiler() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f40$mdx$2d$js$2f$mdx$2f$lib$2f$core$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createProcessor"])({
            jsx,
            format,
            outputFormat,
            providerImportSource,
            // Fix TypeError: _jsx is not a function for remote content
            development: ("TURBOPACK compile-time value", "development") === "development",
            remarkPlugins: [
                ...remarkPlugins || [],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f40$theguild$2f$remark$2d$mermaid$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkMermaid"],
                // should be before remarkRemoveImports because contains `import { Mermaid } from ...`
                [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f40$theguild$2f$remark$2d$npm2yarn$2f$dist$2f$plugin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkNpm2Yarn"],
                    // should be before remarkRemoveImports because contains `import { Tabs as $Tabs, Tab as $Tab } from ...`
                    {
                        packageName: "nextra/components",
                        tabNamesProp: "items",
                        storageKey: "selectedPackageManager"
                    }
                ],
                isRemoteContent && __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$remove$2d$imports$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkRemoveImports"],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$frontmatter$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                // parse and attach yaml node
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$frontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkMdxFrontMatter"],
                readingTime && __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$reading$2d$time$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                // before mdx title
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$custom$2d$heading$2d$id$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkCustomHeadingId"],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$title$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkMdxTitle"],
                [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$assign$2d$frontmatter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkAssignFrontMatter"],
                    {
                        lastCommitTime
                    }
                ],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$gfm$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                format !== "md" && [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$mdx$2d$disable$2d$explicit$2d$jsx$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkMdxDisableExplicitJsx"],
                    // Replace the <summary> and <details> with customized components
                    {
                        whiteList: [
                            "details",
                            "summary",
                            ...whiteListTagsStyling
                        ]
                    }
                ],
                [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$headings$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkHeadings"],
                    {
                        isRemoteContent
                    }
                ],
                staticImage && __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$static$2d$image$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkStaticImage"],
                latex && __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$math$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                // Remove the markdown file extension from links
                [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$link$2d$rewrite$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkLinkRewrite"],
                    {
                        pattern: __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MARKDOWN_URL_EXTENSION_RE"],
                        replace: "",
                        excludeExternalLinks: true
                    }
                ],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$remark$2d$smartypants$2f$dist$2f$plugin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$remark$2d$plugins$2f$remark$2d$export$2d$source$2d$code$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["remarkExportSourceCode"]
            ].filter((v)=>!!v),
            rehypePlugins: [
                ...rehypePlugins || [],
                format === "md" && [
                    // To render `<details>` and `<summary>` correctly
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$raw$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                    // fix Error: Cannot compile `mdxjsEsm` node for npm2yarn and mermaid
                    {
                        passThrough: [
                            "mdxjsEsm",
                            "mdxJsxFlowElement",
                            "mdxTextExpression"
                        ]
                    }
                ],
                [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rehypeParseCodeMeta"],
                    {
                        defaultShowCopyCode
                    }
                ],
                // Should be before `rehypePrettyCode`
                latex && (typeof latex === "object" ? latex.renderer === "mathjax" ? [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2d$better$2d$react$2d$mathjax$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rehypeBetterReactMathjax"],
                    latex.options,
                    isRemoteContent
                ] : [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$katex$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                    latex.options
                ] : __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$katex$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]),
                ...codeHighlight === false ? [] : [
                    [
                        __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$rehype$2d$pretty$2d$code$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
                        {
                            ...__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_REHYPE_PRETTY_CODE_OPTIONS"],
                            ...rehypePrettyCodeOptions
                        }
                    ],
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2d$twoslash$2d$popup$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rehypeTwoslashPopup"],
                    [
                        __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rehypeAttachCodeMeta"],
                        {
                            search
                        }
                    ]
                ],
                __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$rehype$2d$plugins$2f$rehype$2d$extract$2d$toc$2d$content$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["rehypeExtractTocContent"]
            ].filter((v)=>!!v),
            recmaPlugins: [
                ...recmaPlugins || [],
                [
                    __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$recma$2d$plugins$2f$recma$2d$rewrite$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recmaRewrite"],
                    {
                        isPageImport,
                        isRemoteContent
                    }
                ]
            ]
        });
    }
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/page-map/index-page.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createIndexPage",
    ()=>createIndexPage,
    "getIndexPageMap",
    ()=>getIndexPageMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/compile.js [app-rsc] (ecmascript)");
;
function renderCard(item) {
    const icon = item.frontMatter?.icon;
    const Icon = icon ? `<${icon}/>` : "null";
    return `<Cards.Card title="${item.title}" href="${item.route}" icon={${Icon}} />`;
}
async function createIndexPage(pageMap) {
    const result = [];
    let hasCards = false;
    for (const item of pageMap){
        if ("data" in item) {
            continue;
        }
        if (item.type === "separator") {
            if (hasCards) {
                result.push("</Cards>");
                hasCards = false;
            }
            result.push(`## ${item.title}`);
            continue;
        }
        if (!hasCards) {
            hasCards = true;
            result.push("<Cards>");
        }
        result.push(renderCard(item));
    }
    if (hasCards) {
        result.push("</Cards>");
    }
    const rawMdx = result.join("\n");
    const rawJs = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compileMdx"])(rawMdx);
    return rawJs;
}
function getIndexPageMap(pageMap) {
    const result = [];
    for (const item of pageMap){
        if ("data" in item) {
            continue;
        }
        if (item.type === "separator") {
            result.push(item);
        } else {
            const lastResult = result.at(-1);
            if (Array.isArray(lastResult)) {
                lastResult.push(item);
            } else {
                result.push([
                    item
                ]);
            }
        }
    }
    return result;
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/page-map/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMetadata",
    ()=>getMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$normalize$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/normalize.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$to$2d$page$2d$map$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/to-page-map.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$merge$2d$meta$2d$with$2d$page$2d$map$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/merge-meta-with-page-map.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$get$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/get.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$index$2d$page$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/index-page.js [app-rsc] (ecmascript)");
;
;
;
;
;
function getMetadata(page) {
    if ("generateMetadata" in page && // `@sentry/nextjs` makes `generateMetadata` getter function which can be `undefined`
    page.generateMetadata) {
        return page.generateMetadata({});
    }
    if ("metadata" in page) {
        return page.metadata;
    }
    return {};
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/setup-page.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HOC_MDXWrapper",
    ()=>HOC_MDXWrapper
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module 'next-mdx-import-source-file'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
"use no memo";
;
;
;
const Wrapper = getMDXComponents().wrapper;
function HOC_MDXWrapper(MDXContent, hocProps) {
    return function MDXWrapper(props) {
        const children = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createElement"])(MDXContent, props);
        return Wrapper ? /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(Wrapper, {
            ...hocProps,
            children
        }) : children;
    };
}
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-caution.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReactComponent",
    ()=>SvgGithubCaution
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
;
;
const SvgGithubCaution = (props)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(3);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("path", {
            d: "M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        });
        $[0] = t0;
    } else {
        t0 = $[0];
    }
    let t1;
    if ($[1] !== props) {
        t1 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("svg", {
            viewBox: "0 0 16 16",
            fill: "currentColor",
            ...props,
            children: t0
        });
        $[1] = props;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    return t1;
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-caution.js [app-rsc] (ecmascript) <export ReactComponent as GitHubCautionIcon>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GitHubCautionIcon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$caution$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReactComponent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$caution$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-caution.js [app-rsc] (ecmascript)");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-important.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReactComponent",
    ()=>SvgGithubImportant
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
;
;
const SvgGithubImportant = (props)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(3);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("path", {
            d: "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
        });
        $[0] = t0;
    } else {
        t0 = $[0];
    }
    let t1;
    if ($[1] !== props) {
        t1 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("svg", {
            viewBox: "0 0 16 16",
            fill: "currentColor",
            ...props,
            children: t0
        });
        $[1] = props;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    return t1;
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-important.js [app-rsc] (ecmascript) <export ReactComponent as GitHubImportantIcon>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GitHubImportantIcon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$important$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReactComponent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$important$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-important.js [app-rsc] (ecmascript)");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-note.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReactComponent",
    ()=>SvgGithubNote
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
;
;
const SvgGithubNote = (props)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(3);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("path", {
            d: "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        });
        $[0] = t0;
    } else {
        t0 = $[0];
    }
    let t1;
    if ($[1] !== props) {
        t1 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("svg", {
            viewBox: "0 0 16 16",
            fill: "currentColor",
            ...props,
            children: t0
        });
        $[1] = props;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    return t1;
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-note.js [app-rsc] (ecmascript) <export ReactComponent as GitHubNoteIcon>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GitHubNoteIcon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$note$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReactComponent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$note$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-note.js [app-rsc] (ecmascript)");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-tip.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReactComponent",
    ()=>SvgGithubTip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
;
;
const SvgGithubTip = (props)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(3);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("path", {
            d: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"
        });
        $[0] = t0;
    } else {
        t0 = $[0];
    }
    let t1;
    if ($[1] !== props) {
        t1 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("svg", {
            viewBox: "0 0 16 16",
            fill: "currentColor",
            ...props,
            children: t0
        });
        $[1] = props;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    return t1;
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-tip.js [app-rsc] (ecmascript) <export ReactComponent as GitHubTipIcon>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GitHubTipIcon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$tip$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReactComponent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$tip$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-tip.js [app-rsc] (ecmascript)");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-warning.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ReactComponent",
    ()=>SvgGithubWarning
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
;
;
const SvgGithubWarning = (props)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(3);
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("path", {
            d: "M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
        });
        $[0] = t0;
    } else {
        t0 = $[0];
    }
    let t1;
    if ($[1] !== props) {
        t1 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("svg", {
            viewBox: "0 0 16 16",
            fill: "currentColor",
            ...props,
            children: t0
        });
        $[1] = props;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    return t1;
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-warning.js [app-rsc] (ecmascript) <export ReactComponent as GitHubWarningIcon>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GitHubWarningIcon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$warning$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ReactComponent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$warning$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-warning.js [app-rsc] (ecmascript)");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/components/callout.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Callout",
    ()=>Callout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/clsx/dist/clsx.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$caution$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubCautionIcon$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-caution.js [app-rsc] (ecmascript) <export ReactComponent as GitHubCautionIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$important$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubImportantIcon$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-important.js [app-rsc] (ecmascript) <export ReactComponent as GitHubImportantIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$note$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubNoteIcon$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-note.js [app-rsc] (ecmascript) <export ReactComponent as GitHubNoteIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$tip$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubTipIcon$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-tip.js [app-rsc] (ecmascript) <export ReactComponent as GitHubTipIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$warning$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubWarningIcon$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/icons/github-warning.js [app-rsc] (ecmascript) <export ReactComponent as GitHubWarningIcon>");
;
;
;
;
const TypeToEmoji = {
    default: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$tip$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubTipIcon$3e$__["GitHubTipIcon"], {
        height: ".8em",
        className: "x:mt-[.3em]"
    }),
    error: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$caution$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubCautionIcon$3e$__["GitHubCautionIcon"], {
        height: ".8em",
        className: "x:mt-[.3em]"
    }),
    info: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$note$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubNoteIcon$3e$__["GitHubNoteIcon"], {
        height: ".8em",
        className: "x:mt-[.3em]"
    }),
    warning: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$warning$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubWarningIcon$3e$__["GitHubWarningIcon"], {
        height: ".8em",
        className: "x:mt-[.3em]"
    }),
    important: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$icons$2f$github$2d$important$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__ReactComponent__as__GitHubImportantIcon$3e$__["GitHubImportantIcon"], {
        height: ".8em",
        className: "x:mt-[.3em]"
    })
};
const classes = {
    default: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("x:bg-green-100 x:dark:bg-green-900/30", "x:text-green-700 x:dark:text-green-500", "x:border-green-700 x:dark:border-green-800"),
    error: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("x:bg-red-100 x:dark:bg-red-900/30", "x:text-red-700 x:dark:text-red-500", "x:border-red-700 x:dark:border-red-600"),
    info: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("x:bg-blue-100 x:dark:bg-blue-900/30", "x:text-blue-700 x:dark:text-blue-400", "x:border-blue-700 x:dark:border-blue-600"),
    warning: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("x:bg-yellow-50 x:dark:bg-yellow-700/30", "x:text-yellow-700 x:dark:text-yellow-500", "x:border-yellow-700"),
    important: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("x:bg-purple-100 x:dark:bg-purple-900/30", "x:text-purple-600 x:dark:text-purple-400", "x:border-purple-600")
};
const Callout = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(18);
    let className;
    let props;
    let t1;
    let t2;
    if ($[0] !== t0) {
        ({ className, type: t1, emoji: t2, ...props } = t0);
        $[0] = t0;
        $[1] = className;
        $[2] = props;
        $[3] = t1;
        $[4] = t2;
    } else {
        className = $[1];
        props = $[2];
        t1 = $[3];
        t2 = $[4];
    }
    const type = t1 === void 0 ? "default" : t1;
    const emoji = t2 === void 0 ? type && TypeToEmoji[type] : t2;
    const t3 = type && classes[type];
    let t4;
    if ($[5] !== t3) {
        t4 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("nextra-callout x:overflow-x-auto x:not-first:mt-[1.25em] x:flex x:rounded-lg x:border x:py-[.5em] x:pe-[1em]", "x:contrast-more:border-current!", t3);
        $[5] = t3;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== emoji) {
        t5 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("div", {
            className: "x:select-none x:text-[1.25em] x:ps-[.6em] x:pe-[.4em]",
            style,
            "data-pagefind-ignore": "all",
            children: emoji
        });
        $[7] = emoji;
        $[8] = t5;
    } else {
        t5 = $[8];
    }
    let t6;
    if ($[9] !== className) {
        t6 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("x:w-full x:min-w-0", className);
        $[9] = className;
        $[10] = t6;
    } else {
        t6 = $[10];
    }
    let t7;
    if ($[11] !== props || $[12] !== t6) {
        t7 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("div", {
            className: t6,
            ...props
        });
        $[11] = props;
        $[12] = t6;
        $[13] = t7;
    } else {
        t7 = $[13];
    }
    let t8;
    if ($[14] !== t4 || $[15] !== t5 || $[16] !== t7) {
        t8 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxs"])("div", {
            className: t4,
            children: [
                t5,
                t7
            ]
        });
        $[14] = t4;
        $[15] = t5;
        $[16] = t7;
        $[17] = t8;
    } else {
        t8 = $[17];
    }
    return t8;
};
const style = {
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tab",
    ()=>Tab,
    "Tabs",
    ()=>Tabs
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const Tab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Tab() from the server but Tab is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js <module evaluation>", "Tab");
const Tabs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Tabs() from the server but Tabs is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js <module evaluation>", "Tabs");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tab",
    ()=>Tab,
    "Tabs",
    ()=>Tabs
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const Tab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Tab() from the server but Tab is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js", "Tab");
const Tabs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Tabs() from the server but Tabs is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js", "Tabs");
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$components$2f$tabs$2f$index$2e$client$2e$js__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$components$2f$tabs$2f$index$2e$client$2e$js__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$components$2f$tabs$2f$index$2e$client$2e$js__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tabs",
    ()=>Tabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$components$2f$tabs$2f$index$2e$client$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/client/components/tabs/index.client.js [app-rsc] (ecmascript)");
"use no memo";
;
;
const Tabs = Object.assign((props)=>/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$components$2f$tabs$2f$index$2e$client$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Tabs"], {
        ...props
    }), {
    Tab: __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$client$2f$components$2f$tabs$2f$index$2e$client$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Tab"]
});
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/client/components/steps.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Steps",
    ()=>Steps
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/react-compiler-runtime/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/clsx/dist/clsx.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-rsc] (ecmascript)");
;
;
;
;
const Steps = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$react$2d$compiler$2d$runtime$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["c"])(17);
    let children;
    let className;
    let props;
    let style;
    if ($[0] !== t0) {
        ({ children, className, style, ...props } = t0);
        $[0] = t0;
        $[1] = children;
        $[2] = className;
        $[3] = props;
        $[4] = style;
    } else {
        children = $[1];
        className = $[2];
        props = $[3];
        style = $[4];
    }
    const t1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["useId"])();
    let t2;
    if ($[5] !== t1) {
        t2 = t1.replaceAll(":", "");
        $[5] = t1;
        $[6] = t2;
    } else {
        t2 = $[6];
    }
    const id = t2;
    let t3;
    if ($[7] !== className) {
        t3 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])("nextra-steps x:ms-4 x:mb-12 x:border-s x:border-gray-200 x:ps-6", "x:dark:border-neutral-800", className);
        $[7] = className;
        $[8] = t3;
    } else {
        t3 = $[8];
    }
    let t4;
    if ($[9] !== id || $[10] !== style) {
        t4 = {
            ...style,
            "--counter-id": id
        };
        $[9] = id;
        $[10] = style;
        $[11] = t4;
    } else {
        t4 = $[11];
    }
    let t5;
    if ($[12] !== children || $[13] !== props || $[14] !== t3 || $[15] !== t4) {
        t5 = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsx"])("div", {
            className: t3,
            style: t4,
            ...props,
            children
        });
        $[12] = children;
        $[13] = props;
        $[14] = t3;
        $[15] = t4;
        $[16] = t5;
    } else {
        t5 = $[16];
    }
    return t5;
};
;
}),
"[project]/nextra-docs/node_modules/nextra/dist/server/page-map/placeholder.js?lang= [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RouteToFilepath",
    ()=>RouteToFilepath,
    "pageMap",
    ()=>pageMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$normalize$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/normalize.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/nextra-docs/node_modules/nextra/dist/server/page-map/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$app$2f$docs$2f$page$2e$mdx$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/app/docs/page.mdx.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$app$2f$page$2e$jsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/nextra-docs/app/page.jsx [app-rsc] (ecmascript)");
;
;
;
const pageMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$normalize$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePageMap"])([
    {
        name: "docs",
        route: "/docs",
        frontMatter: __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$app$2f$docs$2f$page$2e$mdx$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["metadata"]
    },
    {
        name: "index",
        route: "/",
        frontMatter: (0, __TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$node_modules$2f$nextra$2f$dist$2f$server$2f$page$2d$map$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getMetadata"])(__TURBOPACK__imported__module__$5b$project$5d2f$nextra$2d$docs$2f$app$2f$page$2e$jsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__)
    }
]);
const RouteToFilepath = {};
}),
];

//# sourceMappingURL=ddb4a_nextra_dist_f7d88747._.js.map