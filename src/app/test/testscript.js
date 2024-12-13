const script = {
    start() {
      this.log('Started');
      this.step1();
    },

    step1() {
      // step1. Шаг 1
      const Valve_001 = Device("Valve_001");
      this.setStep("step1")
      Valve_001.off();
      this.mainlog('Text1');
      const Pump_001 = this.getDevice("Pump_001");
      Pump_001.on();
      this.info("undefined","undefined",'Info1');
      const DO_001 = this.getDevice("DO_001");
      DO_001.on();
      this.transition1();
    },

    transition1() {
      // Условие 1
      const Valve_001 = Device("Valve_001");
      const FAN_001 = Device("FAN_001");
      if (((Valve_001.state == 1) || (Valve_001.error == 0) || (FAN_001.state > 0))) {
        // Условие выполнено
        this.step2();
      } else {
        // Условие НЕ выполнено
        this.step3();
      }
    },

    step2() {
      // step2. Шаг 2
      this.setStep("step2")
      const Valve_001 = Device("Valve_001");
      const FAN_001 = Device("FAN_001");
      Valve_001.toggle();
      this.mainlog('Text1');
      FAN_001.toggle();
      const DO_001 = this.getDevice("DO_001");
      DO_001.toggle();
      this.info("undefined","undefined",'Info1');
      this.step4();
    },

    step4() {
      // step4. Шаг 4
      this.setStep("step4")
      const Valve_001 = Device("Valve_001");
      Valve_001.off();
      this.info("undefined","undefined",'Info1');
      this.exit();
    },

    step3() {
      // step3. Шаг 3
      this.setStep("step3")
      const DO_001 = this.getDevice("DO_001");
      DO_001.off();
      const Pump_001 = this.getDevice("Pump_001");
      Pump_001.off();
      this.mainlog('Text1');
      this.info("undefined","undefined",'Info1');
      this.step5();
    },

    step5() {
      // step5. Шаг 5
      this.setStep("step5")
      const Valve_001 = Device("Valve_001");
      Valve_001.off();
      this.info("undefined","undefined",'Info1');
      this.exit();
    }
  }

export default script

