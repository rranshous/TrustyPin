import React from "react";
import { newContextComponents } from "@drizzle/react-components";
import CurrentPins from "./CurrentPins";
import AddContent from "./AddContent";

const { AccountData, ContractData, ContractForm } = newContextComponents;

export default ({ drizzle, drizzleState }) => {
  // destructure drizzle and drizzleState from props
  return (
    <div className="App">


    <div>
      <h1>TrustyPin</h1>
      <p>
        Pin the best
      </p>
    </div>

    <div className="section">
      <h2>Active Account</h2>
      <AccountData
        drizzle={drizzle}
        drizzleState={drizzleState}
        accountIndex={0}
        units="ether"
        precision={3}
      />
    </div>

    <div className="section">
      <h2>pins</h2>
      count:
      <ContractData
        drizzle={drizzle}
        drizzleState={drizzleState}
        contract="TrustyPin"
        method="getNumberOfPins"></ContractData>
      <br/>
      you can pin?:
      <ContractData
        drizzle={drizzle} drizzleState={drizzleState}
        contract="TrustyPin"
        method="isAuthorizedPinner"
        methodArgs={[drizzleState.accounts[0]]}/>
      <br/>
      chunks available:
      <ContractData
        drizzle={drizzle} drizzleState={drizzleState}
        contract="TrustyPin"
        method="chunksAvailable" />
      <br/>
      set chunks available:
      <ContractForm
        drizzle={drizzle}
        contract="TrustyPin" method="setChunksAvailable"
      />
      <br/>
      add pin:
      <ContractForm
        drizzle={drizzle}
        contract="TrustyPin" method="addPin"
        sendArgs={{ gas: 3000000 }} />
      <br/>
      remove pin:
      <ContractForm
        drizzle={drizzle}
        contract="TrustyPin" method="removePin"
        sendArgs={{ gas: 3000000 }} />
      <br/>
      current pins:
      <CurrentPins
        drizzle={drizzle}
        drizzleState={drizzleState} />
    </div>

    <hr/>

      <AddContent
        drizzle={drizzle}
        drizzleState={drizzleState}
        accounts={drizzleState.accounts}/>

    </div>
  );
};
