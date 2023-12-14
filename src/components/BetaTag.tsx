const BetaBadge = () => {
  if (window.location.hostname.startsWith("beta.")) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: -100,
          width: 200,
          height: 70,
          backgroundColor: "#238be6",
          color: "white",
          transform: "rotate(45deg)",
          transformOrigin: "top center",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 73,
            fontSize: 20,
            fontFamily: "monospace",
          }}
        >
          beta
        </div>
      </div>
    );
  }
  return null;
};

export default BetaBadge;
