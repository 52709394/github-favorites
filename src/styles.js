export async function StylesUrl() {

    const styles = `
            header {
                margin-top: 20px;
            }

            body {
                padding-top: 10px;
            }

            /* 固定顶部导航样式 */
            .tutorial-nav {
                top: 0;
                left: 0;
                width: 100%;
                background-color: #444;
                z-index: 1000;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }           
                
            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 10px 20px;
            }

            /* 导航菜单样式 */
            .tutorial-nav ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                gap: 30px;
            }

            .tutorial-nav a {
                color: white;
                text-decoration: none;
                font-weight: bold;
                padding: 5px 10px;
                border-radius: 4px;
                transition: all 0.3s;
            }

            .tutorial-nav a:hover {
                background-color: #666;
            }

            .tutorial-nav a.active {
                color: red;
                border-bottom: 2px solid red;
            }

            /* 返回顶部按钮样式 */
            #back-to-top {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background-color: #333;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            
            #back-to-top:hover {
                background-color: #555;
            }
            
            #back-to-top.visible {
                opacity: 1;
                visibility: visible;
            }		

            .link-style {
                background: none;
                border: none;
                color: #0066cc;
                text-decoration: underline;
                cursor: pointer;
                font: inherit;
                padding: 0;
            }

            .link-style:hover {
                color: #004499;
                text-decoration: none;
            }


            /* 弹窗样式 */
            .modal {
                display: none;
                position: fixed;
                z-index: 1;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                text-align: center;
            }

            .modal-content {
                display: inline-block;
                margin-top: 10vh;
                max-width: 90%;
            }

            .image-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #ff0000;
                text-shadow: 1px 1px 2px #000;
            }

            .modal-image {
                max-width: 100%;
                max-height: 70vh;
                display: block;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
            }

            .close {
                font-size: 40px;
                font-weight: bold;
                position: absolute;
                top: 20px;
                right: 30px;
                cursor: pointer;
                text-shadow: 1px 1px 2px #000;
            }					
    `
    return new Response(styles, {
        headers: { 'Content-Type': 'text/css' }
    })
}