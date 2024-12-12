const TestScript = {
    start() {
    this.log('Started');
    this.step1();
    },
    step1() {
    // step1. Тест
    this.setStep("step1")
    const Valve_001 = Device("Valve_001");
    const Valve_002 = Device("Valve_002");
    const Valve_003 = Device("Valve_003");
    const FAN_001 = Device('FAN_001')
    FAN_001.on();
    Valve_001.off();
    Valve_001.toggle();
    Valve_001.on();
    Valve_003.toggle();
    Valve_002.on();
    Valve_002.setState(1);
    this.mainlog('Text2');
    this.info("undefined","undefined",'Text3');
    this.transition1();
    },
    transition1() {
    // Условие 1
    if (((Valve_001.state == 1) && (Valve_001.error == 0))) {
        // Условие выполнено
        this.step2();
    } else {
        // Условие НЕ выполнено
        this.exit();
    }
    },
    step2() {
    // step2. Тест2
    this.setStep("step2")
    const FAN_002 = this.getDevice("FAN_002");
    FAN_002.off();
    this.mainlog('TExt2');
    this.info("undefined","undefined",'Text3');
    this.exit();
    },
    step3() {
    // step3. Шаг 3
    this.setStep("step3")
    this.step4();
    },
    step4() {
    // step4. Шаг 4
    this.setStep("step4")
    this.step5();
    },
    step5() {
    // step5. Шаг 5
    this.setStep("step5")
    }
}

export default TestScript

