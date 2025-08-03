import TopRightToolbar from "../topRightToolbar/TopRightToolbar";
import BrushToolbar from "../brushToolbar/BrushToolbar";


    // <div>
    //   <div className={styles.toolbar}>
    //     <div className={styles.mainToolContainer}>
    //       <input
    //         type="color"
    //         className={styles.currentColorBox}
    //         value={`#${brushColor.toString(16).padStart(6, "0")}`}
    //         onChange={(e) => changeColor(brushColor, e)}
    //       />
    //       <input
    //         type="range"
    //         min={1}
    //         max={100}
    //         className={styles.currentWidthSlider}
    //         value={brushSize}
    //         onChange={(e) => setBrushSize(Number(e.target.value))}
    //       />
    //     </div>
    //     <div className={styles.toolContainer}>
    //       {usedColors.map((color, index) =>
    //         color !== null ? (
    //           <button
    //             key={`${color}-${index}`}
    //             className={styles.colorBox}
    //             style={{
    //               backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
    //             }}
    //             onClick={() => setBrushColor(color)}
    //           ></button>
    //         ) : (
    //           <button
    //             key={`empty-${-index}`}
    //             className={styles.colorBox}
    //             style={{
    //               backgroundColor: `#5b5a5a`,
    //             }}
    //           ></button>
    //         )
    //       )}
    //     </div>
    //     <TopRightToolbar />
     
    //   </div>
    // </div>


export const Toolbar = () => {

  
  return (
    <div>
    <BrushToolbar />
        <TopRightToolbar />
     
    </div>
  );
};
