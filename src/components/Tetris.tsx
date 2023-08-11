import { Global, css } from "@emotion/react";
import { Suspense, lazy } from "react";

const Tetris = lazy(() => import("react-tetris"));

export const TetrisBox = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Global
        styles={css`
          .game-block {
            margin: 0;
            padding: 0;
            width: 1em;
            height: 1em;
            border: 1px solid #eee;
          }
          .piece-i {
            background-color: #ec858b;
          }
          .piece-j {
            background-color: #f1b598;
          }
          .piece-l {
            background-color: #f8efae;
          }
          .piece-o {
            background-color: #b5a677;
          }
          .piece-s {
            background-color: #816e56;
          }
          .piece-t {
            background-color: #b77c72;
          }
          .piece-z {
            background-color: #e3be58;
          }
          .piece-preview {
            background-color: #eee;
          }
        `}
      />
      <Tetris>
        {({ Gameboard }) => {
          return <Gameboard />;
        }}
      </Tetris>
    </Suspense>
  );
};
