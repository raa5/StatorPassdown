document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".station-content");
  const shiftTabs = document.querySelectorAll(".shift-tab");
  const shiftSettingsForm = document.getElementById("shift-settings-form");

  // Default shift times
  let shiftTimes = {
    "first-shift": { start: "06:00", end: "17:00" },
    "second-shift": { start: "17:00", end: "20:00" },
    "third-shift": { start: "20:00", end: "06:00" },
  };

  function getStoredEntries(stationId) {
    return JSON.parse(localStorage.getItem(`entries-${stationId}`)) || [];
  }

  function saveEntries(stationId, entries) {
    localStorage.setItem(`entries-${stationId}`, JSON.stringify(entries));
  }

  function displayEntries(stationId) {
    const logEntriesContainer = document.getElementById(`log-${stationId}`);
    logEntriesContainer.innerHTML = "";

    const entries = getStoredEntries(stationId);
    entries.forEach((entry, index) => {
      const entryElement = document.createElement("div");
      entryElement.classList.add("log-entry");

      const entryText = document.createElement("p");
      entryText.classList.add("log-entry-content");
      entryText.textContent = entry.text;

      const timestamp = document.createElement("span");
      timestamp.classList.add("timestamp");
      timestamp.textContent = entry.timestamp;

      entryElement.appendChild(entryText);
      entryElement.appendChild(timestamp);

      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-container");

      entry.images.forEach((imgSrc) => {
        const img = document.createElement("img");
        img.src = imgSrc;
        imageContainer.appendChild(img);
      });

      entryElement.appendChild(imageContainer);

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delete-button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        deleteEntry(stationId, index);
      });

      entryElement.appendChild(deleteButton);
      logEntriesContainer.appendChild(entryElement);
    });
  }

  function deleteEntry(stationId, index) {
    const entries = getStoredEntries(stationId);
    const deletedEntries = getStoredEntries(`deleted-${stationId}`) || [];

    deletedEntries.push(entries[index]);
    saveEntries(`deleted-${stationId}`, deletedEntries);

    entries.splice(index, 1);
    saveEntries(stationId, entries);

    displayEntries(stationId);
    displayDeletedEntries(stationId);
  }

  function displayDeletedEntries(stationId) {
    const deletedEntriesContainer = document.getElementById(
      `deleted-entries-${stationId}`
    );
    deletedEntriesContainer.innerHTML = "";

    const deletedEntries = getStoredEntries(`deleted-${stationId}`);
    deletedEntries.forEach((entry, index) => {
      const entryElement = document.createElement("div");
      entryElement.classList.add("log-entry");

      const entryText = document.createElement("p");
      entryText.classList.add("log-entry-content");
      entryText.textContent = entry.text;

      const timestamp = document.createElement("span");
      timestamp.classList.add("timestamp");
      timestamp.textContent = entry.timestamp;

      entryElement.appendChild(entryText);
      entryElement.appendChild(timestamp);

      const restoreButton = document.createElement("button");
      restoreButton.classList.add("delete-button");
      restoreButton.textContent = "Restore";
      restoreButton.addEventListener("click", () => {
        restoreEntry(stationId, index);
      });

      entryElement.appendChild(restoreButton);
      deletedEntriesContainer.appendChild(entryElement);
    });
  }

  function restoreEntry(stationId, index) {
    const deletedEntries = getStoredEntries(`deleted-${stationId}`);
    const entries = getStoredEntries(stationId);

    entries.push(deletedEntries[index]);
    saveEntries(stationId, entries);

    deletedEntries.splice(index, 1);
    saveEntries(`deleted-${stationId}`, deletedEntries);

    displayEntries(stationId);
    displayDeletedEntries(stationId);
  }

  function getShiftForEntry(timestamp) {
    const entryDate = new Date(timestamp);
    const time = entryDate.toTimeString().split(" ")[0];

    for (let shift in shiftTimes) {
      const { start, end } = shiftTimes[shift];

      if ((shift === "third-shift" && time >= start) || time <= end) {
        return shift;
      }

      if (time >= start && time <= end) {
        return shift;
      }
    }
    return "Unspecified Shift";
  }

  function assignShift(entry) {
    entry.shift = getShiftForEntry(entry.timestamp);
  }

  function handleShiftSettingsUpdate() {
    const firstShiftStart = document.getElementById("shift-start-1").value;
    const firstShiftEnd = document.getElementById("shift-end-1").value;
    const secondShiftStart = document.getElementById("shift-start-2").value;
    const secondShiftEnd = document.getElementById("shift-end-2").value;
    const thirdShiftStart = document.getElementById("shift-start-3").value;
    const thirdShiftEnd = document.getElementById("shift-end-3").value;

    shiftTimes = {
      "first-shift": { start: firstShiftStart, end: firstShiftEnd },
      "second-shift": { start: secondShiftStart, end: secondShiftEnd },
      "third-shift": { start: thirdShiftStart, end: thirdShiftEnd },
    };

    // Reevaluate all entries for all stations
    document.querySelectorAll(".station-content").forEach((section) => {
      const stationId = section.id.replace("station", "");
      const entries = getStoredEntries(`entries-${stationId}`);
      entries.forEach((entry) => assignShift(entry));
      saveEntries(`entries-${stationId}`, entries);
      displayEntries(stationId);
    });
  }

  function updateTabView(stationId) {
    displayEntries(stationId);
    const currentShiftTab = document.querySelector(".shift-tab.active");
    const shift = currentShiftTab
      ? currentShiftTab.getAttribute("data-shift")
      : "first-shift";

    document.querySelectorAll(".log-entry").forEach((entryElement) => {
      const entryShift =
        entryElement.querySelector(".timestamp").textContent.split(" ")[1] ||
        "Unspecified Shift";
      if (entryShift !== shift) {
        entryElement.style.display = "none";
      } else {
        entryElement.style.display = "block";
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const stationId = this.getAttribute("data-station");

      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(stationId).classList.add("active");
      displayEntries(stationId);
    });
  });

  shiftTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      shiftTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      const stationId = document
        .querySelector(".tab.active")
        .getAttribute("data-station");
      updateTabView(stationId);
    });
  });

  shiftSettingsForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleShiftSettingsUpdate();
  });

  document.querySelectorAll(".log-form").forEach((form) => {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const stationId = this.id.replace("form-", "");
      const textarea = this.querySelector("textarea");
      const files = this.querySelector('input[type="file"]').files;
      const timestamp = new Date().toLocaleString();

      const newEntry = {
        text: textarea.value,
        timestamp: timestamp,
        images: Array.from(files).map((file) => URL.createObjectURL(file)),
      };

      assignShift(newEntry); // Tag the entry with the correct shift

      const entries = getStoredEntries(stationId);
      entries.push(newEntry);
      saveEntries(stationId, entries);

      displayEntries(stationId);

      textarea.value = "";
      this.querySelector('input[type="file"]').value = "";
    });
  });

  // Initialize the default view
  const initialStationId = document
    .querySelector(".tab.active")
    .getAttribute("data-station");

  // Display entries and update the tab view upon page reload
  displayEntries(initialStationId);
  updateTabView(initialStationId);
});
