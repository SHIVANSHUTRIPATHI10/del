import {
  useEffect,
  useState
} from "react";

import "./App.css";

import GeneratorForm
  from "./components/GeneratorForm";

import SectionPreview
  from "./components/SectionPreview";

import ElementEditor
  from "./components/ElementEditor";

import {
  getSections,
  getSection,
  deleteSection
} from "./services/api";


function App() {

  const [sections, setSections] =
    useState([]);

  const [currentSection, setCurrentSection] =
    useState(null);

  const [selectedElement, setSelectedElement] =
    useState(null);

  const [showGenerator, setShowGenerator] =
    useState(true);

  const [loadingSections, setLoadingSections] =
    useState(false);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD SECTIONS
  // =====================================================

  async function loadSections() {

    try {

      setLoadingSections(true);

      const data =
        await getSections();

      setSections(data);

    } catch (err) {

      console.error(err);

      setError(
        err.message
      );

    } finally {

      setLoadingSections(false);
    }
  }


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadSections();

  }, []);


  // =====================================================
  // OPEN SECTION
  // =====================================================

  async function openSection(
    sectionId
  ) {

    try {

      setError("");

      const data =
        await getSection(
          sectionId
        );


      const section = {

        ...data.section,

        elements:
          data.elements,

        ir: {

          sectionType:
            data.section.sectionType,

          elements:
            data.elements.map(
              (element) => ({

                elementName:
                  element.elementName,

                contentType:
                  element.contentType,

                defaultContent:
                  element.content,

                fieldId:
                  element.fieldId,

                css:
                  element.css,

                loop:
                  element.loop || null,

              })
            )

        }

      };


      setCurrentSection(
        section
      );

      setSelectedElement(null);

      setShowGenerator(false);

    } catch (err) {

      console.error(err);

      setError(
        err.message
      );
    }
  }


  // =====================================================
  // GENERATION COMPLETE
  // =====================================================

  async function handleGenerated(
    data
  ) {

    console.log(
      "Generated:",
      data
    );


    const section = {

      ...data,

      elements:
        data.elements || [],

    };


    setCurrentSection(
      section
    );


    setShowGenerator(false);

    setSelectedElement(null);


    // Refresh sidebar

    await loadSections();
  }


  // =====================================================
  // SELECT ELEMENT
  // =====================================================

  function handleSelectElement(
    element
  ) {

    console.log(
      "Selected:",
      element
    );


    setSelectedElement(
      element
    );
  }


  // =====================================================
  // UPDATE ELEMENT
  // =====================================================

  function handleElementUpdated(
    updated
  ) {

    setCurrentSection(
      previous => {

        if (!previous) {
          return previous;
        }


        const newElements =
          previous.elements.map(
            element => {

              if (
                element.fieldId ===
                updated.fieldId
              ) {

                return updated;
              }


              return element;
            }
          );


        const newIRElements =
          previous.ir.elements.map(
            element => {

              if (
                element.fieldId ===
                updated.fieldId
              ) {

                return {

                  ...element,

                  defaultContent:
                    updated.content,

                  content:
                    updated.content,

                  css:
                    updated.css,

                  loop:
                    updated.loop,

                };
              }


              return element;
            }
          );


        return {

          ...previous,

          elements:
            newElements,

          ir: {

            ...previous.ir,

            elements:
              newIRElements

          }

        };

      }
    );


    setSelectedElement(
      updated
    );
  }


  // =====================================================
  // DELETE
  // =====================================================

  async function handleDeleteSection(
    sectionId
  ) {

    const confirmed =
      window.confirm(
        "Delete this section?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await deleteSection(
        sectionId
      );


      setSections(
        previous =>
          previous.filter(
            section =>
              section.sectionId !==
              sectionId
          )
      );


      if (
        currentSection?.sectionId ===
        sectionId
      ) {

        setCurrentSection(
          null
        );

        setSelectedElement(
          null
        );

        setShowGenerator(
          true
        );
      }


    } catch (err) {

      console.error(err);

      setError(
        err.message
      );
    }
  }


  // =====================================================
  // EXPORT JSX
  // =====================================================

  function exportSection() {

    if (!currentSection) {
      return;
    }


    const elements =
      currentSection.elements || [];


    let jsx = "";


    jsx += `export default function ${(
      currentSection.sectionName ||
      "GeneratedSection"
    ).replace(
      /[^a-zA-Z0-9]/g,
      ""
    )}() {\n\n`;


    jsx += `  return (\n`;

    jsx += `    <section className="generated-section">\n`;


    elements.forEach(
      element => {

        const content =
          element.content || "";


        switch (
          element.contentType
        ) {

          case "Text":

            jsx +=
              `      <h2>${content}</h2>\n`;

            break;


          case "Textfield":

            jsx +=
              `      <p>${content}</p>\n`;

            break;


          case "Image":

            jsx +=
              `      <img src="${content}" alt="${element.elementName}" />\n`;

            break;


          case "Button":

            jsx +=
              `      <button>${content}</button>\n`;

            break;


          case "Cards":

            jsx +=
              `      <div className="cards">\n`;


            (
              element.loop || []
            ).forEach(card => {

              jsx +=
                `        <div className="card">\n`;

              jsx +=
                `          <strong>${card.field1 || ""}</strong>\n`;

              jsx +=
                `          <p>${card.field2 || ""}</p>\n`;

              jsx +=
                `        </div>\n`;

            });


            jsx +=
              `      </div>\n`;

            break;

        }

      }
    );


    jsx += `    </section>\n`;

    jsx += `  );\n`;

    jsx += `}\n`;


    const blob =
      new Blob(
        [jsx],
        {
          type:
            "text/javascript"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href = url;

    link.download =
      `${
        currentSection.sectionName ||
        "GeneratedSection"
      }.jsx`;


    link.click();


    URL.revokeObjectURL(
      url
    );
  }


  // =====================================================
  // NEW SECTION
  // =====================================================

  function newSection() {

    setCurrentSection(
      null
    );

    setSelectedElement(
      null
    );

    setShowGenerator(
      true
    );
  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="cms">


      {/* HEADER */}

      <header className="header">

        <div>

          <h1>
            AI CMS
          </h1>

          <p>
            AI-powered content management system
          </p>

        </div>


        <div className="header-actions">

          {currentSection && (

            <button
              onClick={exportSection}
            >
              Export JSX
            </button>

          )}


          <button>
            My Project
          </button>

        </div>

      </header>



      <div className="layout">


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="sidebar">

          <h3>
            PAGES
          </h3>


          <div className="page active">
            🏠 Home
          </div>


          <h3 className="section-heading">
            SECTIONS
          </h3>


          {loadingSections && (

            <p>
              Loading...
            </p>

          )}


          {sections.map(
            section => (

              <div
                key={section.sectionId}
                className={
                  currentSection?.sectionId ===
                  section.sectionId
                    ? "section-item selected"
                    : "section-item"
                }
              >

                <button
                  className="section-open"
                  onClick={() =>
                    openSection(
                      section.sectionId
                    )
                  }
                >

                  <span>
                    {section.sectionName}
                  </span>

                  <small>
                    {section.sectionType}
                  </small>

                </button>


                <button
                  className="delete-section"
                  onClick={() =>
                    handleDeleteSection(
                      section.sectionId
                    )
                  }
                >
                  ×
                </button>

              </div>

            )
          )}


          <button
            className="generate-btn"
            onClick={newSection}
          >
            + Generate Section
          </button>

        </aside>



        {/* =================================================
            PREVIEW
        ================================================= */}

        <main className="preview">

          <div className="panel-header">

            <div>

              <h2>
                Preview
              </h2>

              <span>
                Home
              </span>

            </div>


            {currentSection && (

              <button
                onClick={newSection}
              >
                New Section
              </button>

            )}

          </div>


          {error && (

            <div className="global-error">
              {error}
            </div>

          )}


          <div className="preview-content">


            {showGenerator ? (

              <GeneratorForm
                onGenerated={
                  handleGenerated
                }
              />

            ) : (

              <SectionPreview
                section={
                  currentSection
                }

                selectedFieldId={
                  selectedElement?.fieldId
                }

                onSelectElement={
                  handleSelectElement
                }
              />

            )}

          </div>

        </main>



        {/* =================================================
            EDITOR
        ================================================= */}

        <aside className="editor">

          <div className="panel-header">

            <h2>
              Editor
            </h2>

            <span>
              Element properties
            </span>

          </div>


          <ElementEditor
            element={
              selectedElement
            }

            onUpdated={
              handleElementUpdated
            }
          />

        </aside>

      </div>

    </div>
  );
}


export default App;