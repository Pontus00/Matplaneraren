document.addEventListener("DOMContentLoaded", function () {
  const apiUrl =
    "https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel?offset=0&limit=20&sprak=1";
  let currentUrl = apiUrl;
  const selectedItems = []; // Array för att lagra valda objekt

  // Hämta data från API
  async function fetchData(url) {
    try {
      document.getElementById("loading").style.display = "block";
      document.getElementById("foodTable").style.display = "none";

      console.log("Hämtar data från:", url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP-fel! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Data mottagen:", data);

      // Visa data
      displayData(data);

      // Ställ in pagination
      if (data._links) {
        setupPagination(data._links);
      }
    } catch (error) {
      console.error("Fel vid hämtning av data:", error);
      document.getElementById("loading").textContent =
        "Ett fel uppstod vid hämtning av data.";
    } finally {
      document.getElementById("loading").style.display = "none";
      document.getElementById("foodTable").style.display = "table";
    }
  }

  function toggleSelection(item) {
    const index = selectedItems.findIndex((selected) => selected.nummer === item.nummer);
    if (index === -1) {
      selectedItems.push(item); // Lägg till objekt i urvalet
    } else {
      selectedItems.splice(index, 1); // Ta bort objekt från urvalet
    }
    console.log("Valda objekt:", selectedItems);
    displaySelectedNutritionValues();
  }

  function displayData(data) {
    const tableBody = document.getElementById("foodData");
    tableBody.innerHTML = "";

    if (!data.livsmedel || data.livsmedel.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3; // Uppdatera colspan för att täcka alla kolumner
      cell.textContent = "Inga livsmedel hittades";
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    data.livsmedel.forEach((item) => {
      const row = document.createElement("tr");

      // Lägg till checkbox-cell
      const checkboxCell = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", () => toggleSelection(item));
      checkboxCell.appendChild(checkbox);
      row.appendChild(checkboxCell);

      // Lägg till nummer-cell
      const nummerCell = document.createElement("td");
      nummerCell.textContent = item.nummer || "-";
      row.appendChild(nummerCell);

      // Lägg till namn-cell
      const nameCell = document.createElement("td");
      nameCell.textContent = item.namn || "-";
      row.appendChild(nameCell);

      tableBody.appendChild(row);
    });
  }

  // Ställ in pagination-kontroller
  function setupPagination(links) {
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.innerHTML = "";

    // Konvertera länkar-array till ett objekt för enklare åtkomst
    const linkMap = {};
    links.forEach((link) => {
      linkMap[link.rel] = link;
    });

    // Första sida-knapp
    if (linkMap.first) {
      const firstBtn = document.createElement("button");
      firstBtn.textContent = "Första";
      firstBtn.onclick = () =>
        fetchData(buildFullUrl(linkMap.first.href));
      paginationDiv.appendChild(firstBtn);
    }

    // Föregående sida-knapp
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Föregående";
    prevBtn.disabled = !linkMap.prev;
    if (linkMap.prev) {
      prevBtn.onclick = () => fetchData(buildFullUrl(linkMap.prev.href));
    }
    paginationDiv.appendChild(prevBtn);

    // Sida-indikator
    const pageIndicator = document.createElement("span");
    pageIndicator.style.padding = "8px 16px";

    if (linkMap.self && linkMap.self.href) {
      const url = new URL(buildFullUrl(linkMap.self.href));
      const offset = parseInt(url.searchParams.get("offset")) || 0;
      const limit = parseInt(url.searchParams.get("limit")) || 20;
      pageIndicator.textContent = `Sida ${
        Math.floor(offset / limit) + 1
      }`;
    } else {
      pageIndicator.textContent = "Sida 1";
    }
    paginationDiv.appendChild(pageIndicator);

    // Nästa sida-knapp
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Nästa";
    nextBtn.disabled = !linkMap.next;
    if (linkMap.next) {
      nextBtn.onclick = () => fetchData(buildFullUrl(linkMap.next.href));
    }
    paginationDiv.appendChild(nextBtn);

    // Sista sida-knapp
    if (linkMap.last) {
      const lastBtn = document.createElement("button");
      lastBtn.textContent = "Sista";
      lastBtn.onclick = () => fetchData(buildFullUrl(linkMap.last.href));
    }
    paginationDiv.appendChild(lastBtn);
  }

  // Hjälpfunktion för att bygga en fullständig URL från en relativ sökväg
  function buildFullUrl(path) {
    // Bas-URL för API:et
    const baseApiUrl = "https://dataportal.livsmedelsverket.se/livsmedel";

    // Kontrollera om sökvägen redan har den fullständiga URL:en
    if (path.startsWith("http")) {
      return path;
    }

    // Se till att sökvägen börjar med en snedstreck
    const formattedPath = path.startsWith("/") ? path : `/${path}`;

    return `${baseApiUrl}${formattedPath}`;
  }

  function displaySelectedNutritionValues() {
    const nutritionSection = document.getElementById("nutritionSection");
    const totalNutrition = document.getElementById("totalNutrition");
    nutritionSection.innerHTML = ""; // Rensa tidigare innehåll
    totalNutrition.innerHTML = ""; // Rensa total näringsvärde-innehåll

    if (selectedItems.length === 0) {
      nutritionSection.textContent = "Inga livsmedel valda.";
      totalNutrition.textContent = "Total näringsvärde: Inga valda livsmedel.";
    } else {
      const totalValues = {}; // Objekt för att lagra totala näringsvärden

      selectedItems.forEach(async (item) => {
        const itemSection = document.createElement("div");
        itemSection.className = "item-section";

        const title = document.createElement("h3");
        title.textContent = `Näringsvärden för ${item.namn}`;
        itemSection.appendChild(title);

        const sliderContainer = document.createElement("div");
        sliderContainer.className = "slider-container";

        const sliderLabel = document.createElement("label");
        sliderLabel.setAttribute("for", `slider-${item.nummer}`);
        sliderLabel.textContent = "Justera mängd (gram):";
        sliderContainer.appendChild(sliderLabel);

        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `slider-${item.nummer}`;
        slider.className = "slider";
        slider.min = "1";
        slider.max = "500";
        slider.value = "100";
        slider.addEventListener("input", () => updateValuesForItem(item.nummer, slider.value, totalValues));
        sliderContainer.appendChild(slider);

        const sliderValue = document.createElement("span");
        sliderValue.id = `sliderValue-${item.nummer}`;
        sliderValue.textContent = "100";
        sliderContainer.appendChild(sliderValue);

        const sliderUnit = document.createTextNode(" g");
        sliderContainer.appendChild(sliderUnit);

        itemSection.appendChild(sliderContainer);

        const list = document.createElement("ul");
        list.id = `nutritionList-${item.nummer}`;
        itemSection.appendChild(list);

        nutritionSection.appendChild(itemSection);

        // Hämta och visa näringsvärden för objektet
        try {
          const nutritionUrl = `https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel/${item.nummer}/naringsvarden?sprak=1`;
          const response = await fetch(nutritionUrl);
          if (!response.ok) {
            throw new Error(`HTTP-fel! Status: ${response.status}`);
          }
          const nutritionData = await response.json();
          nutritionData.forEach((nutrient) => {
            if (nutrient.varde > 0) {
              const listItem = document.createElement("li");
              listItem.setAttribute("data-original-value", nutrient.varde);
              listItem.setAttribute("data-current-value", nutrient.varde);
              listItem.innerHTML = `${nutrient.namn}: <span>${nutrient.varde}</span> ${nutrient.enhet || ""}`;
              list.appendChild(listItem);

              // Uppdatera totala värden
              if (!totalValues[nutrient.namn]) {
                totalValues[nutrient.namn] = 0;
              }
              totalValues[nutrient.namn] += nutrient.varde;
            }
          });

          // Uppdatera total näringsvärde-visning
          updateTotalNutritionDisplay(totalValues);
        } catch (error) {
          console.error(`Fel vid hämtning av näringsdata för ${item.namn}:`, error);
        }
      });
    }
  }

  function updateValuesForItem(nummer, multiplier, totalValues) {
    document.getElementById(`sliderValue-${nummer}`).textContent = multiplier;
    const items = document.querySelectorAll(`#nutritionList-${nummer} li[data-original-value]`);

    items.forEach((item) => {
      const originalValue = parseFloat(item.getAttribute("data-original-value"));
      const previousValue = parseFloat(item.getAttribute("data-current-value")) || 0;
      const newValue = parseFloat((originalValue * multiplier / 100).toFixed(2));

      // Uppdatera visat värde
      item.querySelector("span").textContent = newValue.toFixed(2);

      // Uppdatera totala värden genom att subtrahera det tidigare värdet och lägga till det nya värdet
      const nutrientName = item.textContent.split(":")[0].trim();
      totalValues[nutrientName] = parseFloat(((totalValues[nutrientName] || 0) - previousValue + newValue).toFixed(2));

      // Lagra det aktuella värdet för korrekta omberäkningar
      item.setAttribute("data-current-value", newValue);
    });

    // Se till att totalValues inte rensas och uppdatera visningen
    updateTotalNutritionDisplay(totalValues);
  }

  function updateTotalNutritionDisplay(totalValues) {
    const totalNutrition = document.getElementById("totalNutrition");
    totalNutrition.innerHTML = "<h3>Total Näringsvärde</h3>";
    const list = document.createElement("ul");

    for (const [key, value] of Object.entries(totalValues)) {
      const listItem = document.createElement("li");
      listItem.textContent = `${key}: ${value.toFixed(2)}`;
      list.appendChild(listItem);
    }

    totalNutrition.appendChild(list);
  }

  // Tog bort knappen för att visa näringsvärden
  const showNutritionButton = document.querySelector(".btn-show-nutrition");
  if (showNutritionButton) {
    showNutritionButton.remove();
  }

  // Starta den initiala hämtningen
  fetchData(currentUrl);
});