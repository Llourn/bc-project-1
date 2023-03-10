import AnimalsParameters from "./models/animals.js";
import { fetchAnimals, fetchTypes, fetchBreeds } from "./fetchers.js";

const selectInputEls = document.querySelectorAll("#petSelect sl-select");
const textInputEls = document.querySelectorAll("#petSelect sl-input");
const alertEl = document.querySelector("sl-alert");
const submitBtn = document.getElementById("submit");
const locationEl = document.getElementById("location");
const distanceEl = document.getElementById("distance");
const loadingEl = document.getElementById("loading");
const petSelectEl = document.getElementById("petSelect");

const typesData = await fetchTypes();
const breedsData = await fetchBreeds("Dog");

renderAllDynamicOptions();

// disable distance field if location is empty
locationEl.addEventListener("input", function () {
  if (locationEl.value) {
    distanceEl.disabled = false;
  } else {
    distanceEl.disabled = true;
  }
});

submitBtn.addEventListener("click", buildApiParams);

petSelectEl.addEventListener("submit", (event) => event.preventDefault());

function addOptionsToForm(elementId) {
  // get field via ID
  let inputField = document.getElementById(elementId);
  let html = "";
  let data;
  // assign data related to the ID
  if (elementId === "breed") {
    data = breedsData.breeds;
  } else {
    data = typesData.types[0][`${elementId}s`];
  }

  // loop through the array and generate the sl-option for each item.
  data.forEach((option) => {
    let value = elementId === "breed" ? option.name : option;
    let underscored = value.replace(/ /g, "_");
    html += `<sl-option value="${underscored}">${value}</sl-option>`;
  });

  inputField.innerHTML = html;
}

function renderAllDynamicOptions() {
  let dynamicFields = ["breed", "gender", "color", "coat"];

  dynamicFields.forEach((field) => {
    addOptionsToForm(field);
  });
}

async function buildApiParams(event) {
  event.preventDefault();

  submitBtn.disabled = true;
  loadingEl.classList.add("show");
  sessionStorage.removeItem("searchResults");

  let paramObj = new AnimalsParameters();

  for (let i = 0; i < selectInputEls.length; i++) {
    let option = selectInputEls[i];

    if (option.id === "attributes" || option.id === "good_with") {
      option.value.forEach((value) => {
        paramObj[value] = true;
      });
    } else {
      paramObj[option.id] = convertToApiCompatible(option.value, option.id);
    }
  }

  for (let i = 0; i < textInputEls.length; i++) {
    let inputEl = textInputEls[i];
    paramObj[inputEl.id] = inputEl.value;
  }

  const results = await fetchAnimals(paramObj);
  submitBtn.disabled = false;
  loadingEl.classList.remove("show");

  if (results?.animals?.length) {
    sessionStorage.setItem("searchResults", JSON.stringify(results));
    window.location = "./results.html";
  } else {
    alertEl.show();
  }
}

function convertToApiCompatible(initialValue, field) {
  let processedValue = [];

  if (Array.isArray(initialValue)) {
    if (field === "breed") {
      initialValue.forEach((junk) => {
        let spaced = junk.replace(/_/g, " ");
        processedValue.push(spaced);
      });
    } else {
      initialValue.forEach((junk) => {
        let hyphenated = junk.replace(/[/|,|&| |(|)|_]+/g, "-");
        const last = hyphenated.length - 1;
        let trimmed =
          hyphenated[last] === "-" ? hyphenated.slice(0, -1) : hyphenated;
        processedValue.push(trimmed);
      });
    }
  }
  return processedValue;
}
