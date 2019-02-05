import React from 'react';
import { Spinner } from '@blueprintjs/core';
import Styles from "./Loading.module.css";

export default function Loading() {
  return <Spinner className={Styles.Center} />;
}
