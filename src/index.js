import releasess from './releasess.json';
import { StylesUrl } from './styles.js';
import { MYPREFIX, SetPREFIX, GetGithubHandler, makeRes } from './github_proxy.js';
import { MyQRCodePath, SetQRCodePath, generateQRCode } from './qr_code.js';


let MyReleasessPath = "/app"

// 处理网页访问和定时触发
export default {
	async fetch(request, env, ctx) {

		const url = new URL(request.url);


		if (env.ReleasessPath) {
			if (env.ReleasessPath.search(/^\/[a-zA-Z0-9\/]+$/i) === 0) {
				MyReleasessPath = env.ReleasessPath;
			}
		}

		SetPREFIX(env.PREFIX)
		SetQRCodePath(env.QRCodePath)

		if (url.pathname === MyReleasessPath) {
			url.pathname = MyReleasessPath + '/releases.html'
			return Response.redirect(url.toString(), 301)
		} else if (url.pathname === MyReleasessPath + '/releases.html') {
			return await handleRequest(url, env, "releases");
		} else if (url.pathname === MyReleasessPath + '/other.html') {
			return await handleRequest(url, env, "other");
		} else if (url.pathname === MyReleasessPath + '/static/style.css') {
			return await StylesUrl()
		} else if (url.pathname.startsWith(MyQRCodePath)) {

			const text = url.pathname.slice(MyQRCodePath.length).replace(/^https?:\/+/, 'https://')

			return generateQRCode({ text })
		} else {
			return GetGithubHandler(request).catch(err =>
				makeRes('cfworker error:\n' + err.stack, 502)
			)
		};
	},

	async scheduled(event, env, ctx) {

		for (const repository of releasess.repositorys) {
			await updateReleaseCache(env, repository.name, repository.owner, repository.repo)
		}
	}

}

// 网页显示逻辑
async function handleRequest(url, env, mod) {


	const isInitialized = await env.RELEASE_CACHE.get("init_done");

	if (!isInitialized) {
		console.log("首次访问，初始化 GitHub Release 缓存");
		// getReleaseData(env);

		for (const repository of releasess.repositorys) {
			await updateReleaseCache(env, repository.name, repository.owner, repository.repo)
		}

		// 设置标志，防止重复初始化
		await env.RELEASE_CACHE.put("init_done", "true");
	}

	const qrCodePath = url.origin + MyQRCodePath
	const gitProxyPath = url.origin + MYPREFIX

	let repJump = ""
	let fileJump = ""
	let imgs = ""
	let navActive = ["", ""]

	if (mod === "releases") {
		navActive[0] = `class="active"`
	} else {
		navActive[1] = `class="active"`
	};

	let html = `
	  <!DOCTYPE html>
      <html lang="zh-CN">
         <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GitHub收藏夹</title>
			<link rel="stylesheet" href="${MyReleasessPath}/static/style.css">
         </head>
	  <body>

		<nav class="tutorial-nav">
			<div class="nav-container">
				<ul>
					<li><a href="${MyReleasessPath}/releases.html" ${navActive[0]}>Releases</a></li>
					<li><a href="${MyReleasessPath}/other.html" ${navActive[1]}>Other</a></li>
				</ul>
			</div>
		</nav>	  

	    <!-- 返回顶部按钮 -->
        <button id="back-to-top" title="返回顶部">↑</button>

		<!-- 弹窗结构 - 初始为空 -->
		<div id="imageModal" class="modal">
			<span class="close" onclick="modalClose()">&times;</span>
			<div class="modal-content">
				<div class="image-title"></div> <!-- 空标题 -->
				<img class="modal-image" src="" alt=""> <!-- 空图片 -->
			</div>
		</div>	  
	`;

	if (mod === "releases") {
		for (const repository of releasess.repositorys) {

			if (repository.id && repository.id != "") {
				repJump += `<li><a href="#${repository.id}">${repository.name}</a></li>\n`
			};
		};

		if (repJump != "") {
			html += `
				<header>
				<h1>Releases列表</h1>
				<nav>
					<ul>
						${repJump}
					</ul>
				</nav>
			   </header>
				`
		}

		for (const repository of releasess.repositorys) {

			const cached = await env.RELEASE_CACHE.get(repository.name);

			if (!cached) {
				return new Response("No data cached yet. Please wait for schedule to run.", { status: 503 });
			}

			const release = JSON.parse(cached);
			const assets = release.assets || [];

			if (repository.id && repository.id != "") {
				html += `
			    <div id="${repository.id}">`
			} else {
				html += `
			    <div>`
			}


			html += `<h2>GitHub Release: ${repository.name}</h2>
			<ul>`;

			if (Array.isArray(repository.info) && repository.info.length > 0) {
				for (const info of repository.info) {
					html += info
				};
			}

			for (const asset of assets) {
				html += `<li><a href="${gitProxyPath}${asset.browser_download_url}" target="_blank">${asset.name}</a>    `;
				if (asset.name.toLowerCase().endsWith(".apk")) {
					//html += `<a href="${qrCodePath}${gitProxyPath}${asset.browser_download_url}">二维码</a>`;
					html += `<button class="link-style"
					onclick="showImage('${asset.name}','${qrCodePath}${gitProxyPath}${asset.browser_download_url}','${gitProxyPath}${asset.browser_download_url}')">
					二维码</button> `
					imgs += `new Image().src = "${qrCodePath}${gitProxyPath}${asset.browser_download_url}";\n`
				}

				html += `(${(asset.size / 1024).toFixed(1)} KB)</li>`;
			}
			html += `</ul></div><br><br>`
		}
	} else {

		for (const file of releasess.files) {

			if (file.id && file.id != "") {
				fileJump += `<li><a href="#${file.id}">${file.name}</a></li>\n`
			};
		};

		if (fileJump != "") {
			html += `
			<header>
			<h1>GitHub其他文件列表</h1>
			<nav>
				<ul>
					${fileJump}
				</ul>
			</nav>
		    </header>
		`
		}

		if (Array.isArray(releasess.files) && releasess.files.length > 0) {
			html += `
		    <h1>GitHub Other</h1>`

			for (const file of releasess.files) {

				if (file.id && file.id != "") {
					html += `
			          <div id="${file.id}">`
				} else {
					html += `
			          <div>`
				}

				html += `<h2>${file.name}</h2>`

				if (Array.isArray(file.info) && file.info.length > 0) {
					for (const info of file.info) {
						html += info
					};
				}


				const matches = file.url.match(/\/([^\/]+)$/);

				let aName = ""

				if (matches) {
					aName = matches[1];
				} else {
					aName = "Null";
				}


				html += `<a href="${gitProxyPath}${file.url}" target="_blank">${aName}</a> `

				if (file.url.toLowerCase().endsWith(".apk")) {
					html += `<button class="link-style"
					onclick="showImage('${file.name}','${qrCodePath}${gitProxyPath}${file.url}','${gitProxyPath}${file.url}')">
					二维码</button> `
					imgs += `new Image().src = "${qrCodePath}${gitProxyPath}${file.url}";\n`
				}

				html += `</div>
			<br>`
			}
		}
	}

	html += `
		<script>

            // 获取返回顶部按钮
            const backToTopButton = document.getElementById('back-to-top');		
			// 获取元素
			const modal = document.getElementById("imageModal");
			const title = document.querySelector(".image-title");
			const image = document.querySelector(".modal-image");

			// 监听滚动事件
			window.addEventListener('scroll', function() {
				// 如果页面垂直滚动距离大于250px，显示按钮，否则隐藏
				if (window.pageYOffset > 250) {
					backToTopButton.classList.add('visible');
				} else {
					backToTopButton.classList.remove('visible');
				}
			});
			
			// 点击按钮返回顶部
			backToTopButton.addEventListener('click', function() {
				// 平滑滚动到顶部
				window.scrollTo({
					top: 0,
					behavior: 'smooth'
				});
			});			

			// 点击按钮打开弹窗并设置内容
			function showImage(str, urlA, urlB) {
				// 设置标题
				title.textContent = str;

				// 设置图片
				image.src = urlA; // 替换为你的图片URL
				image.alt = urlB; //"示例图片描述";

				// 显示弹窗
				modal.style.display = "block";
			}

			// 点击关闭按钮关闭弹窗
			function modalClose() {
				modal.style.display = "none";
			}

			// 点击弹窗外部区域关闭弹窗
			window.onclick = function (event) {
				if (event.target == modal) {
					modal.style.display = "none";
				}
				
				${imgs}
			}
		</script>	
	</body>
	</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
}

// 定时更新缓存逻辑
async function updateReleaseCache(env, name, owner, repo) {

	const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

	const response = await fetch(apiUrl, {
		headers: {
			'User-Agent': 'Cloudflare-Worker',
			'Accept': 'application/vnd.github.v3+json',
		}
	});


	if (!response.ok) {
		console.error("Failed to fetch GitHub release:", response.status);
		return;
	}

	const data = await response.json();
	await env.RELEASE_CACHE.put(name, JSON.stringify(data));
}
