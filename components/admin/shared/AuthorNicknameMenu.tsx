// 담당: 피드백/관리자팀

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../admin.module.css";

type Props = {
  nickname: string;
  onSearchPosts: (nickname: string) => void;
};

type MenuPos = { top: number; left: number };

export function AuthorNicknameMenu({ nickname, onSearchPosts }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setPos(null);
      return;
    }

    function updatePos() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (!nickname || nickname === "-") {
    return <span>-</span>;
  }

  return (
    <div className={styles.authorNicknameWrap} ref={rootRef}>
      <button
        type="button"
        className={styles.authorNickname}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {nickname}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.authorMenu}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              type="button"
              className={styles.authorMenuItem}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSearchPosts(nickname);
              }}
            >
              작성글
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
