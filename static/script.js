document.addEventListener("DOMContentLoaded", () => {

    const generateBtn = document.getElementById("generate-btn");
    const promptInput = document.getElementById("prompt-input");
    const loadingDiv = document.getElementById("loading");
    const resultSection = document.getElementById("result-section");
    const comicOutput = document.getElementById("comic-output");
    const downloadPdfBtn = document.getElementById("download-pdf-btn");


    // ==========================================
    // GENERATE COMIC
    // ==========================================

    generateBtn.addEventListener("click", async () => {

        const prompt = promptInput.value.trim();

        if (!prompt) {
            alert("Please enter a story idea!");
            return;
        }


        loadingDiv.style.display = "block";
        resultSection.style.display = "none";

        generateBtn.disabled = true;


        try {

            const response = await fetch("/generate", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    prompt: prompt
                })

            });


            const data = await response.json();


            if (!response.ok || data.error) {

                throw new Error(
                    data.error || "Something went wrong."
                );

            }


            // Convert Gemini response into JSON
            let comicData;

            try {

                comicData = JSON.parse(data.comic_script);

            } catch (error) {

                const cleanedText = data.comic_script
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();

                comicData = JSON.parse(cleanedText);

            }


            // Clear old result
            comicOutput.innerHTML = "";


            // Create comic panels
            comicData.forEach(panel => {

                const panelDiv = document.createElement("div");

                panelDiv.className = "comic-panel";


                panelDiv.innerHTML = `

                    <h3>
                        Panel ${panel.panel}
                    </h3>


                    <img
                        src="/static/images/panel${panel.panel}.png"
                        alt="Comic Panel ${panel.panel}"
                        class="comic-image"
                    >


                    <div class="scene">

                        <strong>Scene</strong>

                        <p>
                            ${panel.description}
                        </p>

                    </div>


                    <div class="dialogue">

                        <strong>Dialogue</strong>

                        <p>
                            "${panel.dialogue}"
                        </p>

                    </div>

                `;


                comicOutput.appendChild(panelDiv);

            });


            resultSection.style.display = "block";


        } catch (error) {

            comicOutput.innerHTML = `

                <div class="error">

                    <strong>Error:</strong>

                    ${error.message}

                </div>

            `;

            resultSection.style.display = "block";

        }


        finally {

            loadingDiv.style.display = "none";

            generateBtn.disabled = false;

        }

    });



    // ==========================================
    // DOWNLOAD PDF
    // ==========================================

    downloadPdfBtn.addEventListener("click", async () => {


        if (!comicOutput.innerHTML.trim()) {

            alert("Please generate a comic first!");

            return;

        }


        try {

            downloadPdfBtn.disabled = true;

            downloadPdfBtn.textContent =
                "Creating PDF...";


            const canvas = await html2canvas(
                comicOutput,
                {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff"
                }
            );


            const imageData =
                canvas.toDataURL("image/png");


            const { jsPDF } = window.jspdf;


            const pdf = new jsPDF(
                "p",
                "mm",
                "a4"
            );


            const pageWidth =
                pdf.internal.pageSize.getWidth();

            const pageHeight =
                pdf.internal.pageSize.getHeight();


            const margin = 10;

            const availableWidth =
                pageWidth - (margin * 2);


            const imageHeight =
                (canvas.height * availableWidth)
                / canvas.width;


            let heightLeft = imageHeight;

            let position = margin;


            pdf.addImage(
                imageData,
                "PNG",
                margin,
                position,
                availableWidth,
                imageHeight
            );


            heightLeft -=
                pageHeight - (margin * 2);


            while (heightLeft > 0) {

                position =
                    heightLeft - imageHeight + margin;

                pdf.addPage();

                pdf.addImage(
                    imageData,
                    "PNG",
                    margin,
                    position,
                    availableWidth,
                    imageHeight
                );

                heightLeft -=
                    pageHeight - (margin * 2);

            }


            pdf.save(
                "ComicCraft-Comic.pdf"
            );


        } catch (error) {

            alert(
                "Could not create PDF: "
                + error.message
            );

        }


        finally {

            downloadPdfBtn.disabled = false;

            downloadPdfBtn.textContent =
                "📄 Download Comic as PDF";

        }

    });

});