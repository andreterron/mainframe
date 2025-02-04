import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigation } from "react-router-dom";
import { useLoadingBar } from "react-top-loading-bar";

const TIME_TO_START_LOADING_BAR_MS = 50;

export function RouterWrapper() {
  const { state } = useNavigation();
  const { start, complete } = useLoadingBar();
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    switch (state) {
      case "loading":
        if (!loading && !timerRef.current) {
          timerRef.current = setTimeout(() => {
            setLoading(true);
            start();
            timerRef.current = undefined;
          }, TIME_TO_START_LOADING_BAR_MS);
        }
        break;
      case "idle":
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = undefined;
        }
        if (loading) {
          complete();
        }
        setLoading(false);
        break;
      // case "submitting": // Not used yet
    }
  }, [state]);

  return <Outlet />;
}
